import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export default function LatestNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetch("/.netlify/functions/getLatestNews")
      .then((res) => res.json())
      .then(setNews)
      .catch(console.error);
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNews(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedNews) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedNews]);

  if (news.length === 0) {
    return (
      <div className="py-32 text-center">
        <div className="text-5xl font-black text-yellow-400 animate-pulse tracking-wider">
          LOADING NEWS...
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="py-10 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-7xl md:text-8xl font-black text-center mb-8 tracking-tighter">
            <span className="text-yellow-400 drop-shadow-lg">LATEST</span>
            <span className="text-white"> NEWS</span>
          </h2>

          <div className="flex overflow-x-auto gap-8 pb-4 no-scrollbar snap-x snap-mandatory">
            {news.map(({ id, title, description, image_url }) => (
              <article
                key={id}
                onClick={() =>
                  setSelectedNews({ id, title, description, image_url })
                }
                className="flex-shrink-0 w-[90vw] max-w-[380px] sm:w-96 snap-center cursor-pointer"
              >
                <div className="relative h-[520px] sm:h-[580px] bg-gradient-to-b from-gray-900 to-black rounded-xl sm:rounded-2xl overflow-hidden border-3 sm:border-4 border-yellow-500 shadow-2xl">
                  {/* Image Section */}
                  <div className="relative h-44 sm:h-52 overflow-hidden">
                    <img
                      src={image_url}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content Section - WITH PADDING FOR BUTTON */}
                  <div className="relative h-[calc(100%-11rem)] sm:h-[calc(100%-13rem)] p-4 sm:p-6 pb-20">
                    {/* Title */}
                    <h3 className="text-3xl sm:text-2xl font-black text-yellow-400 mb-2 sm:mb-3 leading-tight tracking-tight">
                      {title.toUpperCase()}
                    </h3>

                    {/* Description - With overflow hidden */}
                    <div className="overflow-hidden">
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-6">
                        {description}
                      </p>
                    </div>
                  </div>

                  {/* Button - ABSOLUTE POSITIONED AT BOTTOM */}
                  <div className="absolute bottom-2 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                    <button className="w-full px-6 py-2.5 sm:py-3 bg-yellow-400 text-black font-bold text-sm rounded-lg hover:bg-yellow-500 transition-colors duration-300 shadow-lg">
                      READ MORE
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-3 mt-1">
            {news.map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-yellow-400/30 hover:bg-yellow-400 transition-colors duration-300 cursor-pointer"
              />
            ))}
          </div>
        </div>
      </section>

      {/* MODAL POPUP */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-gray-900 to-black rounded-2xl border-4 border-yellow-500 shadow-2xl overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-90"
            >
              <X size={24} className="text-black" />
            </button>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
              {/* Image Header */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Title on Image */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h2 className="text-4xl md:text-6xl font-black text-yellow-400 drop-shadow-lg">
                    {selectedNews.title.toUpperCase()}
                  </h2>
                </div>
              </div>

              {/* Description Content */}
              <div className="p-8 md:p-12">
                <p className="text-gray-200 text-xl leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedNews.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        /* Hide horizontal scrollbar */
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Custom vertical scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #ca8a04 #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #ca8a04;
          border-radius: 10px;
          border: 2px solid #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #f59e0b;
        }

        /* Truncate text to 6 lines */
        .line-clamp-6 {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
