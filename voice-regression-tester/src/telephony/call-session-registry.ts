
import { CallSession } from "./call-session.js";

const sessions = new Map<string, CallSession>();

export function registerCallSession(sessionId: string, testRunId?: string): CallSession {
  const session = new CallSession(sessionId, testRunId ?? sessionId);
  sessions.set(sessionId, session);
  return session;
}

export function getCallSession(sessionId: string) {
  return sessions.get(sessionId);
}