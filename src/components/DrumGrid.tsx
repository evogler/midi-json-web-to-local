import { useEffect, useState } from "react";

type DrumSound = "ride" | "hatopen" | "k" | "h" | "s";

const makeGrid = (columnCount: number, rowCount: number): boolean[][] => {
  const grid: boolean[][] = [];
  for (let i = 0; i < columnCount; i++) {
    grid.push(new Array(rowCount).fill(false));
  }
  return grid;
};

const gridToPattern = (grid: boolean[][], rows: DrumSound[]): DrumSound[][] => {
  const res: DrumSound[][] = [];
  for (let i = 0; i < grid.length; i++) {
    res.push([]);
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j]) {
        res[i].push(rows[j] as DrumSound);
      }
    }
  }
  return res;
};

type Props = {
  setPattern: (pattern: DrumSound[][]) => void;
  widths: number[];
  rows: DrumSound[];
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

export const DrumGrid = <T,>({
  setPattern,
  widths: inputtedWidths,
  rows,
  columnCount,
}: Props): JSX.Element => {
  const rowCount = rows.length;
  const widths = fit(extend(inputtedWidths, columnCount), 500);
  const [grid, setGrid] = useState<boolean[][]>(
    makeGrid(columnCount, rowCount)
  );

  useEffect(() => {
    setGrid((lastGrid) => {
      if (lastGrid.length < columnCount) {
        const newGrid = [...lastGrid];
        for (let i = lastGrid.length; i < columnCount; i++) {
          newGrid.push(new Array(rowCount).fill(false));
        }
        return newGrid;
      } else {
        return lastGrid.slice(0, columnCount);
      }
    });
  }, [columnCount, rowCount]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div className="flex flex-col mr-2">
        {rows.map((row, i) => (
          <div className="h-[20px]"
          key={JSON.stringify(row)}>{JSON.stringify(row).slice(1,-1)}</div>
        ))}
      </div>
      {grid.map((row, i) => {
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              blockSize: "fit-content",
            }}
          >
            {row.map((cell, j) => {
              return (
                <button
                  key={j}
                  data-cell-id={`${i}-${rows[j]}`}
                  className={`border-black border-[.5px] ${grid[i][j] ? "bg-blue-500" : "bg-white"} transition-colors`}
                  onClick={() => {
                    const newGrid = [...grid];
                    newGrid[i][j] = !newGrid[i][j];
                    setGrid(newGrid);
                    setPattern(gridToPattern(newGrid ,rows));
                    console.log("set pattern to", gridToPattern(newGrid, rows));
                  }}
                  style={{
                    // border: "1px solid black",
                    width: `${widths[i]}px`,
                    height: "20px",
                    // transition: '.5s',
                    // backgroundColor: grid[i][j] ? "#880" : "white",
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
