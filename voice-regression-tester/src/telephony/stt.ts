// src/telephony/stt.ts
export interface SpeechToTextProvider {
  transcribe(audioChunk: Buffer): Promise<string>;
}

export class MockSTTProvider implements SpeechToTextProvider {
  async transcribe(audioChunk: Buffer): Promise<string> {
    const raw = audioChunk.toString("utf-8");
    if (raw.startsWith("AUDIO_DATA:")) {
      const parts = raw.split(":");
      return parts[1] || "Transcribed spoken text";
    }
    return "Transcribed audio response";
  }
}
