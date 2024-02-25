import * as http from "http";
import { promises as fs } from "fs";
import { parse } from "url";
import { play } from "midisender/src/playmidi";
async function playMusic(music) {
    await fs.writeFile("notes.json", JSON.stringify(music));
    const kill = play(music);
    return kill;
    // exec(
    //   "node /Users/eric/Workspace/midisender/dist/main notes.json",
    //   (error, stdout, stderr) => {
    //     if (error) {
    //       console.error(`exec error: ${error}`);
    //       return;
    //     }
    //     console.log(`stdout: ${stdout}`);
    //     console.error(`stderr: ${stderr}`);
    //   }
    // );
    // return "Playing music";
}
const requestHandler = async (req, res) => {
    const parsedUrl = parse(req.url, true);
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-type");
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
    }
    else if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on("end", async () => {
            console.log(body);
            const data = JSON.parse(body);
            const music = data.music;
            console.log("MUSIC:", music);
            // Uncomment the next line to actually play music
            await playMusic(music);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(JSON.stringify({ message: "Sending a reply, post-haste!" }));
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
