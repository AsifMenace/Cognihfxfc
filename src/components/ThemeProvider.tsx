// src/components/ThemeProvider.tsx
import React from "react";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
