// src/telephony/stt.ts
import "dotenv/config";
import WebSocket from "ws";

export interface LiveTranscriber {
  sendAudio(chunk: Buffer): void;
  close(): void;
}

// Fires once Deepgram detects the speaker paused — that pause is what we treat
// as "the agent finished this turn."
export function startLiveTranscription(onFinalTranscript: (text: string) => void): LiveTranscriber {
  const apiKey = process.env.DEEPGRAM_API_KEY ?? "";
  const params = new URLSearchParams({
    model: "nova-2-phonecall",
    encoding: "mulaw",
    sample_rate: "8000",
    channels: "1",
    interim_results: "false",
    endpointing: "500",
    smart_format: "true",
  });

  const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  const socket = new WebSocket(url, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });

  socket.on("message", (data: WebSocket.RawData) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === "Results") {
        const text = response.channel?.alternatives?.[0]?.transcript?.trim();
        if (text && response.is_final) {
          onFinalTranscript(text);
        }
      }
    } catch {
      // Ignore non-JSON messages
    }
  });

  socket.on("error", (err: Error) => {
    console.error("Deepgram WebSocket error:", err);
  });

  return {
    sendAudio: (chunk: Buffer) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(chunk);
      }
    },
    close: () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    },
  };
}