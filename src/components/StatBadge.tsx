import React from 'react';

const GRADIENTS = {
  blue: 'from-blue-500 to-indigo-600',
  purple: 'from-purple-500 to-fuchsia-600',
  teal: 'from-teal-500 to-cyan-600',
} as const;

interface StatBadgeProps {
  emoji: string;
  color: keyof typeof GRADIENTS;
  size?: number;
}

const StatBadge: React.FC<StatBadgeProps> = ({ emoji, color, size = 40 }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${GRADIENTS[color]} shadow-lg ring-2 ring-white/10`}
    style={{ width: size, height: size, fontSize: size * 0.5, lineHeight: 1 }}
  >
    {emoji}
  </span>
);

export default StatBadge;
