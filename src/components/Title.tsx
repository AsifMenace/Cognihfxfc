// src/components/Title.tsx
import React from "react";

type TitleProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Title({ children, className = "" }: TitleProps) {
  // Convert children to string and split into words
  const text = React.Children.toArray(children).join(" ").trim();

  if (!text) return null;

  const words = text.split(/\s+/);
  const firstWord = words[0];
  const restWords = words.slice(1).join(" ");

  return (
    <h1
      className={`text-7xl md:text-8xl font-black text-center mb-8 tracking-tighter ${className}`}
    >
      <span className="text-yellow-400 drop-shadow-lg">{firstWord}</span>
      {restWords && <span className="text-white"> {restWords}</span>}
    </h1>
  );
}
