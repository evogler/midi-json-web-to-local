import * as http from "http";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { parse } from "url";
import { play, type MusicData } from "midisender/dist/playmidi.js";

let currentKill: null | (() => void) = null;

async function playMusic(music: MusicData) {
  if (currentKill) {
    currentKill();
  }
  await fs.writeFile("notes.json", JSON.stringify(music));
  currentKill = await play(music);
  // return kill;
}

const requestHandler = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const parsedUrl = parse(req.url!, true);

  // CORS headers
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
      body += chunk.toString(); // convert Buffer to string
    });
    req.on("end", async () => {
      console.log(body);
      const data = JSON.parse(body);
      if (data.music) {
        const music = data.music;
        console.log("MUSIC:", music);
        // Uncomment the next line to actually play music
        playMusic(music);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ message: "Sending a reply, post-haste!" }));
      } else if (data.stop) {
        if (currentKill) {
          currentKill();
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ message: "should have stopped. "}))
      } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ message: "huh?"}))
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
};

main();
