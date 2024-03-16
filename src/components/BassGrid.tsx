import { useState } from "react";

// const gridToPattern = (grid: boolean[][]): DrumSound[][] => {
//   const res: DrumSound[][] = [];
//   for (let i = 0; i < grid.length; i++) {
//     res.push([]);
//     for (let j = 0; j < grid[i].length; j++) {
//       if (grid[i][j]) {
//         res[i].push(["h", "s", "k"][j] as DrumSound);
//       }
//     }
//   }
//   return res;
// };

type NoteInfo = { time: number; pitch: number };

type Props = {
  setPattern: (pattern: NoteInfo[]) => void;
  widths: number[];
  rows: number[];
  columnCount: number;
};

const extend = (arr: number[], length: number): number[] => {
  const res = [];
  for (let i = 0; i < length; i++) {
    res.push(arr.at(i % arr.length) as number);
  }
  return res;
};

const fit = (vals: number[], length: number) => {
  const sum = vals.reduce((a, b) => a + b, 0);
  return vals.map((v) => (v / sum) * length);
};

const range = (a: number): number[] => {
  const res = [];
  for (let i = 0; i < a; i++) {
    res.push(i);
  }
  return res;
};

export const BassGrid = ({
  setPattern,
  widths: inputtedWidths,
  rows,
  columnCount
}: Props): JSX.Element => {
  const rowCount = rows.length;
  const widths = fit(extend(inputtedWidths, columnCount), 500);
  const [grid, setGrid] = useState<NoteInfo[]>([]);
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {range(columnCount).map((col) => {
        return (
          <div
            key={col}
            style={{
              display: "flex",
              flexDirection: "column",
              blockSize: "fit-content",
            }}
          >
            {range(rowCount).toReversed().map((row) => (
              <button
                key={row}
                onClick={() => {
                  const newGrid = [...grid];
                  const currentNote = newGrid.find((n) => n.time === col);
                  if (currentNote) {
                    newGrid.splice(newGrid.indexOf(currentNote), 1);
                  } else {
                    newGrid.push({ time: col, pitch: rows[row] });
                  }
                  setGrid(newGrid);
                  setPattern(newGrid);
                  // console.log("set pattern to", gridToPattern(newGrid));
                }}
                style={{
                  border: ".5px solid black",
                  width: `${widths[col]}px`,
                  height: "12px",
                  backgroundColor: grid.some(
                    (x) => x.time === col && x.pitch === row
                  )
                    ? "#880"
                    : "white",
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};
