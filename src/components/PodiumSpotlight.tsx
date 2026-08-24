import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface PodiumEntry {
  id: number;
  name: string;
  position: string;
  photo?: string;
  value: number;
}

interface PodiumSpotlightProps {
  title: string;
  unit: string;
  icon: React.ReactNode;
  entries: PodiumEntry[];
}

const RANK_STYLES: Record<
  number,
  { block: string; ring: string; height: string; avatar: string; medal: string; order: string }
> = {
  1: {
    block: 'bg-gradient-to-b from-yellow-400 to-amber-500 text-slate-900',
    ring: 'ring-yellow-400',
    height: 'h-24 md:h-28',
    avatar: 'w-20 h-20 md:w-24 md:h-24',
    medal: '🥇',
    order: 'order-2',
  },
  2: {
    block: 'bg-gradient-to-b from-slate-300 to-slate-400 text-slate-900',
    ring: 'ring-slate-300',
    height: 'h-16 md:h-20',
    avatar: 'w-16 h-16 md:w-20 md:h-20',
    medal: '🥈',
    order: 'order-1',
  },
  3: {
    block: 'bg-gradient-to-b from-amber-700 to-amber-800 text-white',
    ring: 'ring-amber-700',
    height: 'h-12 md:h-14',
    avatar: 'w-16 h-16 md:w-20 md:h-20',
    medal: '🥉',
    order: 'order-3',
  },
};

const PodiumSpotlight: React.FC<PodiumSpotlightProps> = ({ title, unit, icon, entries }) => {
  const top3 = entries.slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center justify-center gap-3 text-lg md:text-xl font-bold text-yellow-400 mb-6">
        {icon}
        {title}
      </h3>
      <div className="flex items-end justify-center gap-3 md:gap-6">
        {top3.map((player, idx) => {
          const rank = idx + 1;
          const style = RANK_STYLES[rank];
          return (
            <motion.div
              key={player.id}
              className={`flex flex-col items-center ${style.order}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12, duration: 0.6 }}
            >
              <Link to={`/player/${player.id}`} className="flex flex-col items-center group">
                <div className="relative mb-2">
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      className={`${style.avatar} rounded-full object-cover ring-4 ${style.ring} shadow-lg group-hover:scale-105 transition-transform`}
                    />
                  ) : (
                    <div
                      className={`${style.avatar} rounded-full bg-slate-700 flex items-center justify-center font-black text-white ring-4 ${style.ring}`}
                    >
                      {player.name[0]}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-xl md:text-2xl">
                    {style.medal}
                  </span>
                </div>
                <p className="font-bold text-xs md:text-sm text-white truncate max-w-[90px] md:max-w-[130px] text-center">
                  {player.name}
                </p>
                <p className="text-gray-400 text-[10px] md:text-xs mb-1 truncate max-w-[90px] md:max-w-[130px]">
                  {player.position}
                </p>
                <p className="text-lg md:text-2xl font-black text-white">{player.value}</p>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide mb-2">
                  {unit}
                </p>
              </Link>
              <div
                className={`w-16 md:w-28 ${style.height} ${style.block} rounded-t-lg flex items-start justify-center pt-2 font-black text-xl md:text-3xl shadow-xl`}
              >
                {rank}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PodiumSpotlight;
