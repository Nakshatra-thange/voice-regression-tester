// src/telephony/call-session-registry.ts
import { CallSession } from "./call-session.js";

class CallSessionRegistry {
  private sessions = new Map<string, CallSession>();

  register(session: CallSession): void {
    this.sessions.set(session.callSid, session);
  }

  get(callSid: string): CallSession | undefined {
    return this.sessions.get(callSid);
  }

  remove(callSid: string): void {
    this.sessions.delete(callSid);
  }
}

export const callSessionRegistry = new CallSessionRegistry();
