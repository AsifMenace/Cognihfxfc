import React, { useEffect, useState } from "react";
import { Trophy } from "lucide-react"; // IMPORT THESE!
import { football } from "@lucide/lab"; // or { soccerBall } – both exist!

type Player = {
  name: string;
  photoUrl: string;
  goals: number;
};

type PlayerOfTheMatchProps = {
  matchId?: number;
};

export const PlayerOfTheMatch: React.FC<PlayerOfTheMatchProps> = ({
  matchId,
}) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchPlayer = async () => {
      let url = "/.netlify/functions/getPlayerOfTheMatch";
      if (matchId !== undefined) url += `?match_id=${matchId}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setPlayer(data);
        setTimeout(() => setIsLoaded(true), 400);
      } catch (error) {
        console.error(error);
        setPlayer(null);
      }
    };
    fetchPlayer();
  }, [matchId]);

  if (!player) {
    return (
      <div className="text-center py-16 text-gray-400 font-medium text-lg italic">
        Player Of The Match Not Announced Yet
      </div>
    );
  }

  return (
    <>
      <div
        className="relative w-[340px] mx-auto"
        style={{ perspective: "1000px" }}
      >
        <div
          className={`relative transform-gpu transition-all duration-1000 ${
            isLoaded ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <div className="relative w-full h-[520px] rounded-3xl overflow-hidden shadow-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-4 border-yellow-500/30">
            {/* Shine */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine"></div>
            </div>

            {/* Trophy Badge - PERFECT POSITION */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30">
              <div className="relative">
                <div className="absolute -inset-2 bg-yellow-400/40 blur-3xl animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 font-black text-xs uppercase tracking-widest px-3 py-2 rounded-full shadow-2xl border-3 border-yellow-300 flex items-center gap-2">
                  <Trophy size={40} className="text-slate-900" />
                  {matchId !== undefined
                    ? "PLAYER OF THE MATCH"
                    : "LAST MATCH HERO"}
                </div>
              </div>
            </div>

            {/* Player Photo - FULLY VISIBLE */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full overflow-hidden border-8 border-yellow-400 shadow-2xl ring-8 ring-yellow-300/40 z-20">
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-110"
              />
            </div>

            {/* PLAYER NAME — Z-50 + WHITE GLOW FOR MAX READABILITY */}
            <div className="absolute top-[330px] left-1/2 -translate-x-1/2 text-center z-50 w-full px-6">
              <h2 className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(251,251,251,0.9)] [text-shadow:0_4px_10px_rgba(0,0,0,0.8)] tracking-tight animate-fade-up leading-none">
                {player.name.toUpperCase()}
              </h2>
            </div>

            {/* GOALS BADGE — MOVED BELOW NAME + Z-40 */}
            <div className="absolute top-96 left-1/2 -translate-x-1/2 z-40">
              <div className="animate-bounce-in">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-900 font-black text-2xl px-8 py-4 rounded-3xl shadow-2xl border-4 border-yellow-200 flex items-center gap-3 backdrop-blur-sm">
                  <span className="text-5xl">⚽</span>
                  <div className="text-right">
                    <div className="text-6xl leading-none">{player.goals}</div>
                    <div className="text-xl font-bold -mt-1">
                      {player.goals === 1 ? "GOAL" : "GOALS"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Club */}
            <div className="absolute bottom-11 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-6 py-2 text-yellow-300 font-bold tracking-wider text-sm shadow-lg">
                COGNI HFX FC
              </div>
            </div>

            {/* Confetti */}
            {isLoaded && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-confetti"
                    style={{
                      left: `${15 + i * 7}%`,
                      top: "-10px",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GLOBAL CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateX(0); }
          50% { transform: translateY(-16px) rotateX(4deg); }
        }
        @keyframes shine {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
        }

        .animate-shine { animation: shine 5s linear infinite; }
        .animate-fade-up { animation: fade-up 0.9s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 1s ease-out forwards; }
        .animate-confetti { animation: confetti 3.5s ease-out forwards; }

        .scale-100 { animation: float 8s ease-in-out infinite; }
      `}</style>
    </>
  );
};
