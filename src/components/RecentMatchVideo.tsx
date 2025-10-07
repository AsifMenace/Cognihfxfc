import React from "react";
import MatchVideoEmbed from "./MatchVideoEmbed";
import { SectionHeader } from "./SectionHeader";

interface Match {
  id: number;
  date: string;
  time: string;
  video_url?: string | null;
  home_team_name?: string | null;
  away_team_name?: string | null;
  opponent?: string | null;
}

interface RecentMatchVideoProps {
  matches: Match[];
}

const RecentMatchVideo: React.FC<RecentMatchVideoProps> = ({ matches }) => {
  if (!matches?.length) return null;

  const sorted = matches
    .filter((m) => m.video_url)
    .sort((a, b) => {
      const dA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dB.getTime() - dA.getTime();
    });

  const match = sorted[0];
  if (!match) return null;

  return (
    <section className="max-w-4xl mx-auto my-10 px-2">
      <SectionHeader title="Latest Match Video" />
      <div className="mb-3 text-center text-gray-600 font-semibold">
        {match.home_team_name && match.away_team_name ? (
          <>{`${match.home_team_name} vs ${match.away_team_name}`}</>
        ) : (
          <>{match.opponent}</>
        )}
      </div>
      <MatchVideoEmbed videoUrl={match.video_url || null} />
    </section>
  );
};

export default RecentMatchVideo;
