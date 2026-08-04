// src/telephony/call-session.ts
export interface CallTurn {
  role: "CALLER" | "AGENT";
  text: string;
  timestamp: number;
}

export class CallSession {
  public id: string;
  public turns: CallTurn[] = [];
  public status: "IN_PROGRESS" | "COMPLETED" | "FAILED" = "IN_PROGRESS";

  constructor(public callSid: string, public testRunId: string) {
    this.id = callSid;
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
}
