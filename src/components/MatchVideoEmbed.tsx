import React from "react";

interface MatchVideoEmbedProps {
  videoUrl: string | null;
}

const MatchVideoEmbed: React.FC<MatchVideoEmbedProps> = ({ videoUrl }) => {
  if (!videoUrl) {
    return (
      <div className="text-center text-gray-500 italic">
        No match video available.
      </div>
    );
  }

  const videoIdMatch = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  if (!videoId) {
    return (
      <div className="text-center text-red-600 font-semibold">
        Invalid video URL.
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="w-full max-w-3xl mx-auto rounded-lg overflow-hidden border shadow-md bg-white">
      <div className="relative pt-[56.25%]">
        {" "}
        {/* 16:9 Aspect Ratio */}
        <iframe
          src={embedUrl}
          title="Match Video"
          allowFullScreen
          frameBorder={0}
          className="absolute top-0 left-0 w-full h-full"
          style={{ borderRadius: "12px" }} // soften corners inside container
        />
      </div>
    </div>
  );
};

export default MatchVideoEmbed;
