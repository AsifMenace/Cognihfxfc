import React, { useMemo } from "react";

interface TeamBadgeProps {
  color?: string | null;
  name: string;
  size?: number;
}

type PatternFn = (primary: string, secondary: string) => React.ReactNode;

// Bold, flag-style geometric patterns (stripes, cross, chevron, etc.) instead
// of a mascot/icon. Picked deterministically per team so a team's badge
// stays stable across renders/pages instead of changing at random.
const PATTERNS: PatternFn[] = [
  // horizontal stripes
  (p, s) => (
    <>
      <rect width="80" height="80" fill={p} />
      <rect y="26.6" width="80" height="26.6" fill={s} />
    </>
  ),
  // vertical stripes
  (p, s) => (
    <>
      <rect width="80" height="80" fill={p} />
      <rect x="26.6" width="26.6" height="80" fill={s} />
    </>
  ),
  // diagonal split
  (p, s) => (
    <>
      <rect width="80" height="80" fill={p} />
      <polygon points="0,0 80,0 0,80" fill={s} />
    </>
  ),
  // chevron
  (p, s) => (
    <>
      <rect width="80" height="80" fill={p} />
      <polygon points="0,0 40,40 0,80" fill={s} />
    </>
  ),
  // nordic-style cross
  (p, s) => (
    <>
      <rect width="80" height="80" fill={p} />
      <rect x="28" width="14" height="80" fill={s} />
      <rect y="33" width="80" height="14" fill={s} />
    </>
  ),
  // circle
  (p, s) => (
    <>
      <rect width="80" height="80" fill={p} />
      <circle cx="40" cy="40" r="20" fill={s} />
    </>
  ),
  // quartered
  (p, s) => (
    <>
      <rect width="40" height="40" fill={p} />
      <rect x="40" width="40" height="40" fill={s} />
      <rect y="40" width="40" height="40" fill={s} />
      <rect x="40" y="40" width="40" height="40" fill={p} />
    </>
  ),
  // triangle from left edge
  (p, s) => (
    <>
      <rect width="80" height="80" fill={p} />
      <polygon points="0,80 0,0 46,40" fill={s} />
    </>
  ),
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  color,
  name,
  size = 36,
}) => {
  const primary = color || "#374151";
  const pattern = useMemo(() => {
    const key = name.trim().toLowerCase();
    return PATTERNS[hashString(key) % PATTERNS.length];
  }, [name]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={name}
      style={{
        borderRadius: Math.round(size * 0.22),
        border: "1px solid rgba(0,0,0,0.15)",
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      {pattern(primary, "#ffffff")}
    </svg>
  );
};
