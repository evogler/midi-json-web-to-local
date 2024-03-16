import React, { useState, useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

type Props = {
  width?: number;
};

export const CircleGrid = ({ width = 400 }: Props): JSX.Element => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; rotation: number }>();

  const dataSet = {
    datasets: [
      {
        data: [1, 29, 1, 29, 1, 39, 1, 19, 1, 39],
        backgroundColor: ["#FFCE56", "#2682cB88"],
        borderColor: "rgba(255, 255, 255, 0)",
        borderWidth: 0,
      },
    ],
    labels: [],
  };

  const options = {
    cutout: "80%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    animation: { animateRotate: false },
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    dragStartRef.current = {
      x: event.clientX - centerX,
      y: event.clientY - centerY,
      rotation: rotation,
    };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentX = event.clientX - centerX;
    const currentY = event.clientY - centerY;

    const startAngle = Math.atan2(
      dragStartRef.current.y,
      dragStartRef.current.x
    );
    const currentAngle = Math.atan2(currentY, currentX);
    let angleDiff = currentAngle - startAngle;

    let newRotation =
      dragStartRef.current.rotation + angleDiff * (180 / Math.PI);
    if (newRotation < 0) newRotation += 360;
    else if (newRotation > 360) newRotation -= 360;

    setRotation(newRotation);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // To handle the case when the mouse leaves the element while dragging
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <Doughnut
        data={dataSet}
        options={options}
        style={{ rotate: `${rotation}deg`, transition: "0.3s" }}
        width={width}
        height={width}
      />
    </div>
  );
};
