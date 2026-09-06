import React from "react";

interface JerseyIconProps {
  color?: string | null;
  size?: number;
}

export const JerseyIcon: React.FC<JerseyIconProps> = ({ color, size = 24 }) => {
  const fill = color || "#374151";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M8 2 L4 5 L2 9 L5 11 L6 9 L6 21 L18 21 L18 9 L19 11 L22 9 L20 5 L16 2 L14 4 Q12 5.5 10 4 Z"
        fill={fill}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.75"
      />
    </svg>
  );
};
