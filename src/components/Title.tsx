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
      className={`text-5xl md:text-7xl font-black tracking-tight text-center mb-12 ${className}`}
    >
      <span className="text-yellow-400 drop-shadow-lg">{firstWord}</span>
      {restWords && <span className="text-white"> {restWords}</span>}
    </h1>
  );
}
