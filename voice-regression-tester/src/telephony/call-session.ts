// src/telephony/call-session.ts
import WebSocket from "ws";
import { synthesizeSpeech } from "./tts.js";
import { startLiveTranscription, type LiveTranscriber } from "./stt.js";

export interface CallTurn {
  role: "CALLER" | "AGENT";
  text: string;
  timestamp: number;
}

export class CallSession {
  public id: string;
  public turns: CallTurn[] = [];
  public status: "IN_PROGRESS" | "COMPLETED" | "FAILED" = "IN_PROGRESS";

  private ws: WebSocket | null = null;
  private streamSid: string | null = null;
  private isReady = false;
  private readyResolvers: Array<() => void> = [];
  private onAudioChunk: ((chunk: Buffer) => void) | null = null;

  constructor(public callSid: string, public testRunId: string = "default-run") {
    this.id = callSid;
  }

  attachSocket(ws: WebSocket) {
    this.ws = ws;

    ws.on("message", (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.event === "start") {
          this.streamSid = msg.streamSid || msg.start?.streamSid || null;
          this.isReady = true;
          for (const resolve of this.readyResolvers) {
            resolve();
          }
          this.readyResolvers = [];
        } else if (msg.event === "media") {
          if (msg.media?.payload && this.onAudioChunk) {
            const buffer = Buffer.from(msg.media.payload, "base64");
            this.onAudioChunk(buffer);
          }
        } else if (msg.event === "stop") {
          this.complete();
        }
      } catch (err) {
        console.error("Error processing Twilio WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      this.complete();
    });

    ws.on("error", (err) => {
      console.error("CallSession WebSocket error:", err);
      this.fail();
    });
  }

  async waitUntilReady(timeoutMs = 15000): Promise<void> {
    if (this.isReady) return;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timeout waiting for Twilio WebSocket stream to connect"));
      }, timeoutMs);

      this.readyResolvers.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  async speak(text: string): Promise<void> {
    this.addTurn("CALLER", text);
    const audioBuffer = await synthesizeSpeech(text);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not open to send audio");
    }

    const chunkSize = 640;
    for (let offset = 0; offset < audioBuffer.length; offset += chunkSize) {
      const chunk = audioBuffer.subarray(offset, offset + chunkSize);
      const payload = chunk.toString("base64");
      const message = JSON.stringify({
        event: "media",
        streamSid: this.streamSid,
        media: { payload },
      });
      this.ws.send(message);
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  async listenForReply(timeoutMs = 15000): Promise<{ text: string; latencyMs: number }> {
    const startTime = Date.now();
    let firstSpeechTime: number | null = null;

    return new Promise<{ text: string; latencyMs: number }>((resolve) => {
      let resolved = false;
      let transcriber: LiveTranscriber | null = null;

      const cleanup = () => {
        this.onAudioChunk = null;
        if (transcriber) {
          transcriber.close();
          transcriber = null;
        }
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ text: "", latencyMs: Date.now() - startTime });
        }
      }, timeoutMs);

      transcriber = startLiveTranscription((text: string) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          const latencyMs = firstSpeechTime ? firstSpeechTime - startTime : Date.now() - startTime;
          this.addTurn("AGENT", text);
          cleanup();
          resolve({ text, latencyMs });
        }
      });

      this.onAudioChunk = (chunk: Buffer) => {
        if (!firstSpeechTime) {
          firstSpeechTime = Date.now();
        }
        transcriber?.sendAudio(chunk);
      };
    });
  }

  addTurn(role: "CALLER" | "AGENT", text: string) {
    this.turns.push({
      role,
      text,
      timestamp: Date.now(),
    });
  }

  complete() {
    this.status = "COMPLETED";
  }

  fail() {
    this.status = "FAILED";
  }

  close() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close();
    }
    this.ws = null;
  }
}
