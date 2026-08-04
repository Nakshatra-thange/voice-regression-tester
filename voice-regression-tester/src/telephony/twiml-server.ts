// src/telephony/twiml-server.ts
import express from "express";
import { callSessionRegistry } from "./call-session-registry.js";

export function createTwiMLServer(port: number = 3001) {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.post("/twiml/incoming", (req, res) => {
    const callSid = req.body.CallSid || "dummy-sid";
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting to Voice Regression Tester simulation...</Say>
    <Connect>
        <Stream url="wss://${req.headers.host}/media-stream" />
    </Connect>
</Response>`;
    res.type("text/xml").send(twiml);
  });

  app.post("/twiml/status", (req, res) => {
    const callSid = req.body.CallSid;
    const callStatus = req.body.CallStatus;
    const session = callSessionRegistry.get(callSid);

    if (session) {
      if (callStatus === "completed") {
        session.complete();
      } else if (callStatus === "failed") {
        session.fail();
      }
    }
    res.sendStatus(200);
  });

  return app;
}
