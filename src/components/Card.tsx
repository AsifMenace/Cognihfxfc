// src/components/Card.tsx
import React from "react";

export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}
