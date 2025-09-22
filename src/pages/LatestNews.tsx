import React, { useEffect, useState } from "react";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export default function LatestNews() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch("/.netlify/functions/getLatestNews")
      .then((res) => res.json())
      .then(setNews)
      .catch(console.error);
  }, []);

  return (
    <div className="mt-10" max-w-6xl mx-auto>
      <h2 className="text-2xl font-bold mb-4 px-4">Latest News</h2>
      <div
        className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar px-4 md:px-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {news.map(({ id, title, description, image_url }) => (
          <div
            key={id}
            className="flex-shrink-0 w-72 md:w-80 lg:w-96 rounded-lg shadow-lg bg-white scroll-snap-align-start"
          >
            <img
              src={image_url}
              alt={title}
              className="w-full h-48 md:h-56 lg:h-64 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
