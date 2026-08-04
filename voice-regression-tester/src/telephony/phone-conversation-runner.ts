// src/telephony/phone-conversation-runner.ts
import { TwilioClient } from "./twilio-client.js";
import { CallSession } from "./call-session.js";
import { callSessionRegistry } from "./call-session-registry.js";
import { MockTTSProvider } from "./tts.js";
import { MockSTTProvider } from "./stt.js";

export interface PhoneRunnerConfig {
  phoneNumber: string;
  webhookUrl: string;
  testRunId: string;
}

export class PhoneConversationRunner {
  private tts = new MockTTSProvider();
  private stt = new MockSTTProvider();

  constructor(private twilioClient: TwilioClient) {}

  async runPhoneTest(config: PhoneRunnerConfig): Promise<CallSession> {
    const { callSid } = await this.twilioClient.initiateCall(
      config.phoneNumber,
      config.webhookUrl
    );

    const session = new CallSession(callSid, config.testRunId);
    callSessionRegistry.register(session);

    // Simulate initial spoken prompt
    session.addTurn("CALLER", "Hello, I would like to make a reservation.");
    const audio = await this.tts.synthesize("Hello, I would like to make a reservation.");
    const text = await this.stt.transcribe(audio);
    session.addTurn("AGENT", text);

    session.complete();
    return session;
  }
}
