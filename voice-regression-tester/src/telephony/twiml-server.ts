// src/telephony/twiml-server.ts
import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { getCallSession } from "./call-session-registry.js";

const app = express();
app.use(express.urlencoded({ extended: false }));

app.post("/twiml", (req, res) => {
  const sessionId = req.query.sessionId as string;
  const host = process.env.PUBLIC_SERVER_URL!.replace(/^https?:\/\//, "");
  res.type("text/xml").send(`<Response><Connect><Stream url="wss://${host}/media-stream?sessionId=${sessionId}" /></Connect></Response>`);
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/media-stream" });

wss.on("connection", (ws: WebSocket, req) => {
  const sessionId = new URL(req.url!, "http://localhost").searchParams.get("sessionId")!;
  const session = getCallSession(sessionId);
  if (!session) return ws.close();
  session.attachSocket(ws);
});

export function startTwiMLServer(port = 4002) {
  server.listen(port, () => console.log(`TwiML/media-stream server listening on :${port}`));
}