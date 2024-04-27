import * as http from "http";
import { promises as fs } from "fs";
// import { exec } from "child_process";
import { parse } from "url";
// import { Server } from "ws";
import WebSocket, { WebSocketServer } from 'ws';
import {
  MidiPlayer,
  type MusicData,
  EventCallbackData,
} from "midisender/dist/playmidi.js";

const wss = new WebSocketServer({ port: 8081 });
let sendToWs: (message: string) => void;

let killLiveNotes: null | (() => void) = null;
let swapInData: null | ((data: MusicData) => void) = null;
let player: MidiPlayer | undefined;

async function playMusic(music: MusicData) {
  await fs.writeFile("notes.json", JSON.stringify(music));
  if (player) {
    player.swapInData(music);
    player.play();
  } else {
    player = new MidiPlayer(music, () => {});
    player.setEventCallback(({ id, status }: EventCallbackData) => {
      const message = `${status}: ${id}`;
      console.log('triggering locally:', message);
      sendToWs(message);
    });
    player.play();
    killLiveNotes = () => {
      if (player) player.killAndFinish();
      player = undefined;
    };
    swapInData = (data: MusicData) => {
      if (player) player.swapInData(data);
    };
  }
}

function stopMusic() {
  if (killLiveNotes) {
    killLiveNotes();
    killLiveNotes = null;
    swapInData = null;
  }
}

const requestHandler = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const parsedUrl = parse(req.url!, true);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-type"
  );

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "GET") {
    console.log(`Request: ${req.url}`);
    console.log("Headers:", req.headers);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(JSON.stringify({ message: "Hey there, you go getter!" }));
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      const data = JSON.parse(body);
      if (data.music) {
        playMusic(data.music);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ message: "Sending a reply, post-haste!" }));
      } else if (data.stop) {
        stopMusic();
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ message: "should have stopped. " }));
      } else if (data.test) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(
          JSON.stringify({
            message: `test response - ${Math.floor(Math.random() * 10000)}`,
          })
        );
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ message: "huh?" }));
      }
    });
  }
};

export const main = () => {
  const server = http.createServer(requestHandler);

  const port = 8251;
  server.listen(port, "localhost", () => {
    console.log(`Server started on localhost:${port}...`);
  });

  wss.on("connection", (ws) => {
    ws.on("message", (message: string) => {
      console.log("received: %s", message);
    });
    sendToWs = (message: string) => {
      ws.send(message);
      console.log('sent message to ws:', message)
    };
    console.log("Server started on port 8081");
  });

  console.log('main completed')
};

main();
