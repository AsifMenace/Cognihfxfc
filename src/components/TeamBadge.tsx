import React from "react";

interface TeamBadgeProps {
  color?: string | null;
  name: string;
  size?: number;
}

function getAbbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    // Multi-word: first letter of first two words + first letter of third if exists
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  // Single word: first 3 chars
  return name.slice(0, 3).toUpperCase();
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  color,
  name,
  size = 36,
}) => {
  const fill = color || "#374151";
  const abbr = getAbbr(name);
  const w = size;
  const h = Math.round(size * 1.15);
  const fontSize = Math.round(size * 0.28);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 40 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={name}
    >
      {/* Shield shape */}
      <path
        d="M20 1 L39 7 L39 27 Q39 38 20 45 Q1 38 1 27 L1 7 Z"
        fill={fill}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />
      {/* Inner highlight line */}
      <path
        d="M20 5 L35 10 L35 27 Q35 36 20 42"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Abbreviation */}
      <text
        x="20"
        y="25"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontWeight="800"
        fontSize={fontSize}
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.5"
      >
        {abbr}
      </text>
    </svg>
  );
};
