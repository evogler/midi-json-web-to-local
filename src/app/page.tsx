"use client";
import { BassGrid } from "@/components/BassGrid";
import { CircleGrid } from "@/components/CircleGrid";
import { DrumGrid } from "@/components/DrumGrid";
import { parse } from "path";
import { useCallback, useEffect, useRef, useState } from "react";

interface Note {
  pitch: number;
  velocity: number;
  channel: number;
  time: number;
  duration: number;
}

interface MusicData {
  bpm: number;
  notes: Note[];
}

type DrumSound = "ride" | "hatopen" | "k" | "h" | "s";

const makeRandomNotes = (bpm: number) => {
  const notes = [];
  let root = Math.floor(Math.random() * 12);
  for (let i = 0; i < 1000; i++) {
    // const pitch = Math.floor(Math.random() * 12) + 43;
    const pitch = root + 43;
    // root = (root + 11) % 12;
    const voicings = [
      // [0,1,2,3,4,5,6,7,8]
      [-24, -12, 0, 5, 7, 10, 14, 15, 17],
      [-24, -12, 0, 7, 9, 11, 14, 16, 18],
    ];
    // const voicing = voicings.at(Math.random() * voicings.length) as number[];
    const voicing = voicings.at(i % voicings.length) as number[];
    for (let v = 0; v < voicing.length; v++) {
      const interval = voicing[v];
      notes.push({
        pitch: pitch + interval,
        velocity: 76,
        channel: 0,
        time: i * 1 + v / 30,
        duration: 0.99,
      });
    }
  }
  return { bpm, notes };
};

const drumNumbers: Record<DrumSound, number> = {
  ride: 51,
  hatopen: 46,
  k: 36,
  h: 42,
  s: 38,
};

const makeDrumBeat = (
  timePattern: number[],
  drumPattern: DrumSound[][]
): Note[] => {
  const notes: Note[] = [];
  const volumePattern: number[] = "100 40 80 40"
    .split(" ")
    .map((s) => parseInt(s));
  let time = 0;
  // let timePattern = [0.4, 0.6, 0.6, 0.5, 0.5, 0.4];
  for (let i = 0; i < 5000; i++) {
    const patternPos = i % drumPattern.length;
    const patternNotes = drumPattern[patternPos];
    patternNotes.forEach((sound, j) => {
      notes.push({
        pitch: drumNumbers[sound],
        // velocity: volumePattern[i % volumePattern.length],
        velocity: 80,
        channel: 9,
        time,
        duration: 0.1,
      });
    });
    time += timePattern[i % timePattern.length];
  }
  return notes;
};

const makeBassLine = (
  pitchesAndTimes: { pitch: number; time: number }[],
  timePattern: number[],
  partLen: number
): Note[] => {
  const part: Note[] = [];

  let timePos = 0;
  for (let i = 0; i < 10000; i++) {
    const pos = i % partLen;
    const duration = timePattern[i % timePattern.length];
    if (pitchesAndTimes.some((pt) => pt.time === pos)) {
      const { time, pitch } = pitchesAndTimes.find((pt) => pt.time === pos) as {
        time: number;
        pitch: number;
      };
      part.push({
        pitch: 48 + pitch,
        velocity: 100,
        channel: 0,
        time: timePos,
        duration: duration - 0.01,
      });
    }
    timePos += duration;
  }
  return part;
};

const playMusic = async (music: MusicData) => {
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

const stop = async () => {
  let res = "";
  await fetch("http://localhost:8251", {
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

const sendTestMessageToServer = async () => {
  let res = "";
  await fetch("http://localhost:8251", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ test: true }),
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

const fit = (vals: number[], length: number) => {
  const sum = vals.reduce((a, b) => a + b, 0);
  return vals.map((v) => (v / sum) * length);
};

const parseTimeInputString = (s: string, codes: Record<string, string>) => {
  const tempRes = s
    .trim()
    .split(" ")
    .map((s2) => codes?.[s2] ?? s2);
  console.log("*** debug parseTimeInputString tempRes", codes, tempRes);
  const res = s
    .trim()
    .split(" ")
    .map((s2) => codes?.[s2] ?? s2)
    .map((s2) => {
      try {
        return parseFloat(s2);
      } catch {
        return null;
      }
    })
    .filter((n) => n !== null && !Number.isNaN(n)) as number[];
  if (res.length === 0) {
    return [1];
  }
  return res;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [bpm, setBpm] = useState(180);
  const [timePattern, setTimePattern] = useState([0.45, 0.55]);
  const [timeInputString, setTimeInputString] = useState("4.5 5.5");
  const [codes, setCodes] = useState<Record<string, string>>({
    s: "2",
    l: "3",
  });
  const startDrumPattern = ""
    .split(" ")
    .map((s) => s.split("")) as DrumSound[][];
  const [drumPattern, setDrumPattern] = useState(startDrumPattern);
  const [drumPatternRawSum, setDrumPatternRawSum] = useState(1);
  const [drumColumnCount, setDrumColumnCount] = useState(8);
  const [bassColumnCount, setBassColumnCount] = useState(12);
  const [bassTAndP, setBassTAndP] = useState<{ time: number; pitch: number }[]>(
    [
      // { time: 0, pitch: 0 },
      // { time: 3, pitch: 10 },
      // { time: 8, pitch: 0 },
      // { time: 10, pitch: 0 },
      // { time: 12, pitch: 10 },
    ]
  );

  const handlePlay = useCallback(async () => {
    const startTime = new Date().getTime();
    const drumBeat = makeDrumBeat(timePattern, drumPattern);
    const bassLine = drumBeat.concat(
      makeBassLine(bassTAndP, timePattern, bassColumnCount)
    );
    const allParts = [...drumBeat, ...bassLine];
    allParts.sort((a, b) => a.time - b.time);
    const res = await playMusic({ bpm, notes: allParts });
    const endTime = new Date().getTime();
    const time = endTime - startTime;
    setMessage(JSON.stringify({ res, time }));
  }, [timePattern, drumPattern, bassTAndP, bassColumnCount, bpm]);

  const drumPatternUpdated = useRef(false);
  useEffect(() => {
    if (drumPatternUpdated.current) {
      handlePlay();
      drumPatternUpdated.current = false;
    }
  }, [drumPattern, handlePlay]);

  useEffect(() => {
    setDrumPattern((lastDrumPattern) => {
      if (lastDrumPattern.length < drumColumnCount) {
        return lastDrumPattern.concat(
          Array(drumColumnCount - lastDrumPattern.length).fill([])
        );
      } else {
        return lastDrumPattern.slice(0, drumColumnCount);
      }
    });
  }, [drumColumnCount]);

  return (
    <main className="flex min-h-screen flex-col items-center space-y-4 bg-slate-900 p-24">
      <div>
        BPM{" "}
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="rounded-lg p-2 w-24 text-center text-black"
        />
      </div>
      <div className="flex flex-row gap-2">
        pulse{" "}
        <input
          type="text"
          value={timeInputString}
          onChange={(e) => {
            const s = e.target.value;
            setTimeInputString(s);
            try {
              const nums = parseTimeInputString(s, codes);
              setTimePattern(fit(nums, nums.length / 2));
            } finally {
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handlePlay();
            }
          }}
          className="rounded-lg p-2 w-96 text-center text-black"
        />
        <button
          className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
          onClick={() => {
            // const options = [1, 2, 3, 4, 5];
            const options = [3, 4, 2];
            const nums = [...new Array(4)].map(() =>
              options.at(Math.random() * options.length)
            ) as number[];
            setTimeInputString(nums.join(" "));
            setTimePattern(fit(nums, nums.length / 2));
            drumPatternUpdated.current = true;
            handlePlay();
          }}
        >
          random
        </button>
        {/* <span className="text-white">
          SUM:{" "}
          {parseTimeInputString(timeInputString, codes).reduce(
            (a, b) => a + b,
            0
          )}
        </span> */}
      </div>
      {["s", "l"].map((code) => (
        <div key={code}>
          {code}{" "}
          <input
            className="text-black"
            type="number"
            value={codes[code]}
            onChange={(e) => {
              setCodes({ ...codes, [code]: e.target.value });
              setTimePattern(
                fit(
                  parseTimeInputString(timeInputString, codes),
                  timePattern.length / 2
                )
              );
            }}
          />
        </div>
      ))}
      <div>
        <div>
          drum
          <input
            className="text-black m-4"
            value={drumColumnCount}
            onChange={(e) => {
              try {
                const n = parseInt(e.target.value);
                if (n > 0) {
                  setDrumColumnCount(n);
                }
              } catch {}
            }}
          />
        </div>
        <DrumGrid
          setPattern={(pattern) => {
            setDrumPattern(pattern);
            drumPatternUpdated.current = true;
          }}
          widths={timePattern}
          rows={["ride", "hatopen", "h", "s", "k"]}
          columnCount={drumColumnCount}
        />
      </div>
      <div>
        <div>
          bass
          <input
            className="text-black m-4"
            value={bassColumnCount}
            onChange={(e) => {
              try {
                const n = parseInt(e.target.value);
                if (n > 0) {
                  setBassColumnCount(n);
                }
              } catch {}
            }}
          />
        </div>

        <BassGrid
          setPattern={setBassTAndP}
          widths={timePattern}
          rows={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
          columnCount={bassColumnCount}
        />
      </div>
      <div className="space-x-4">
        <button
          className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
          onClick={() => {
            const currentInput = parseTimeInputString(timeInputString, codes);
            const newInput = currentInput.map((t) => t + 1);
            const newPattern = fit(newInput, currentInput.length / 2);
            setTimePattern(newPattern);
            setTimeInputString(newInput.join(" "));
          }}
        >
          +
        </button>
        <button
          className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
          onClick={() => {
            const currentInput = parseTimeInputString(timeInputString, codes);
            const newInput = currentInput.map((t) => t - 1);
            const newPattern = fit(newInput, currentInput.length / 2);
            setTimePattern(newPattern);
            setTimeInputString(newInput.join(" "));
          }}
        >
          -
        </button>
        <button
          onClick={handlePlay}
          className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
        >
          PLAY
        </button>
        <button
          onClick={async () => {
            setMessage(JSON.stringify(await stop()));
          }}
          className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
        >
          STOP
        </button>
      </div>
      {message}
      {JSON.stringify(drumPattern)}
      drumColumnCount: {drumColumnCount}
      <button
        className="bg-pink-800 rounded-lg p-2 bg-pink-700:focus"
        onClick={async () => {
          const startTime = new Date().getTime();
          const res = await sendTestMessageToServer();
          const endTime = new Date().getTime();
          setMessage(`${res} --- ${endTime - startTime}ms`);
        }}
      >
        TEST
      </button>
    </main>
  );
}
