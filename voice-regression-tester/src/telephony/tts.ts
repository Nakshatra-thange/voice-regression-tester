// src/telephony/tts.ts
export interface TextToSpeechProvider {
  synthesize(text: string, voiceId?: string): Promise<Buffer>;
}

export class MockTTSProvider implements TextToSpeechProvider {
  async synthesize(text: string, voiceId?: string): Promise<Buffer> {
    // Generate dummy audio buffer (mulaw / pcm for telephone streams)
    return Buffer.from(`AUDIO_DATA:${text}:${voiceId ?? "default"}`);
  }
}
