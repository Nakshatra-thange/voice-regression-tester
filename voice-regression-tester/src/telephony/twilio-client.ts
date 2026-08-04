// src/telephony/twilio-client.ts
import "dotenv/config";
import Twilio from "twilio";

const client = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

// We place the call TO the agent under test — same as any real caller would.
export async function placeTestCall(targetPhoneNumber: string, sessionId: string) {
  const publicUrl = process.env.PUBLIC_SERVER_URL!;
  return client.calls.create({
    to: targetPhoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER!,
    url: `${publicUrl}/twiml?sessionId=${sessionId}`,
  });
}