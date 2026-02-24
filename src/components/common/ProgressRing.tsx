import React from 'react';

function ringColor(value: number) {
  if (value < 40) return '#D63B3B';
  if (value < 70) return '#F59E0B';
  return '#5A7A5C';
}

export default function ProgressRing({
  value,
  size = 86,
  stroke = 8,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E8E3DA" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor(clamped)}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <p className="type-card-title">{clamped}%</p>
        {label ? <p className="type-micro uppercase text-text-muted">{label}</p> : null}
      </div>
    </div>
  );
}
