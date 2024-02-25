"use client";
import { useEffect, useState } from "react";

const makeMusic = (bpm: number) => {
  const notes = [];
  for (let i = 0; i < 100; i++) {
    notes.push({
      pitch: Math.floor(Math.random() * 36) + 36,
      velocity: 76,
      channel: 0,
      time: i * 1,
      duration: 0.49,
    });
  }
  return { bpm, notes };
};

const playMusic = async (bpm: number) => {
  const music = makeMusic(bpm);
  let res = "";
  await fetch("http://localhost:8251", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ music }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      res = data.message;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  return res;
};

const stop = () => {
  let res = "";
  fetch("http://localhost:8251", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stop: true }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      res = data.message;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  return res;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [bpm, setBpm] = useState(100);

  return (
    <main className="flex min-h-screen flex-col items-center space-y-4 bg-slate-900 p-24">
      {message}
      <input
        type="number"
        value={bpm}
        onChange={(e) => setBpm(parseInt(e.target.value))}
        className="rounded-lg p-2 w-24 text-center text-black"
      />
      <div className="space-x-4">
        <button
          onClick={async () => {
            const startTime = new Date().getTime();
            const res = await playMusic(bpm);
            const endTime = new Date().getTime();
            const time = endTime - startTime;
            setMessage(JSON.stringify({ res, time }));
          }}
          className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
        >
          PLAY
        </button>
        <button
          onClick={() => setMessage(JSON.stringify(stop))}
          className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
        >
          STOP
        </button>
      </div>
    </main>
  );
}
