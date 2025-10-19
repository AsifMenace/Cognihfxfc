import React, { useEffect, useState } from "react";

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

  useEffect(() => {
    const fetchPlayer = async () => {
      let url = "/.netlify/functions/getPlayerOfTheMatch";
      if (matchId !== undefined) {
        url += `?match_id=${matchId}`;
      }

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch player of the match");
        const data = await res.json();
        setPlayer(data);
      } catch (error) {
        console.error(error);
        setPlayer(null);
      }
    };

    fetchPlayer();
  }, [matchId]);

  if (!player)
    return (
      <div className="text-center text-gray-500 italic">
        Player Of The Match Not Available
      </div>
    );

  return (
    <div className="relative w-[320px] h-[470px] mx-auto">
      {/* Card background */}
      <div className="absolute inset-0 rounded-[32px] border-8 border-yellow-400 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-blue-900 via-blue-700 to-blue-400"></div>
        <div className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-yellow-200/10 to-transparent"></div>
        <div className="absolute left-0 top-[45px] w-3 h-[270px] bg-gradient-to-b from-yellow-300 via-yellow-100 to-transparent opacity-75 rounded-r-xl"></div>
        <div className="absolute right-0 top-[45px] w-3 h-[270px] bg-gradient-to-b from-yellow-300 via-yellow-100 to-transparent opacity-75 rounded-l-xl"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[38px] bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 rounded-b-full blur-[1.5px] opacity-70"></div>
        <div className="absolute inset-0 pointer-events-none rounded-2xl ring-4 ring-yellow-200/60 shadow-lg"></div>
      </div>
      {/* Bigger Player photo */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-[40px] w-[240px] h-[240px] rounded-full bg-white overflow-hidden border-4 border-yellow-300 shadow-lg z-10">
        <img
          src={player.photoUrl}
          alt={player.name}
          className="w-full h-full object-cover object-top"
        />
      </div>

      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-900 text-yellow-200 font-bold px-4 py-2 rounded-lg shadow-md tracking-wider text-xs text-center">
        {matchId !== undefined
          ? "PLAYER OF THE MATCH"
          : "PLAYER OF THE LAST MATCH"}
      </div>

      {/* Player info */}
      <div className="absolute bottom-[84px] w-full text-center z-20">
        <div className="text-[26px] font-extrabold text-yellow-100 drop-shadow-lg uppercase tracking-wide">
          {player.name}
        </div>
        <div className="mt-2 text-[20px] font-bold text-blue-900 bg-yellow-300 rounded-xl px-6 py-1 shadow inline-block">
          ⚽ {player.goals} Goals
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-200 text-blue-900 text-xs rounded-full px-3 py-1 font-bold shadow-md tracking-wide">
        CogniHFX FC
      </div>
    </div>
  );
};
