// src/components/Title.tsx
import React from "react";

export default function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-center mb-12">
      <span className="text-yellow-400 drop-shadow-lg">{children}</span>
    </h1>
  );
}
