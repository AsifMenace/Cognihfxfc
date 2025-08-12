import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { galleryImages } from '../data/mockData';

const Gallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', 'match', 'training', 'celebration', 'team'];

  const filteredImages = filter === 'all' 
    ? galleryImages 
    : galleryImages.filter(image => image.category === filter);

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-green-100 text-green-800';
      case 'celebration': return 'bg-yellow-100 text-yellow-800';
      case 'team': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Photo Gallery</h1>
          <p className="text-lg md:text-xl text-slate-600 px-4">Capturing our best moments on and off the pitch</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 mb-6 md:mb-8 px-4">
          <Filter className="text-slate-600 mr-1 md:mr-2" size={18} />
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                filter === category
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {getCategoryLabel(category)}
              {category !== 'all' && (
                <span className="ml-1 md:ml-2 text-xs opacity-75">
                  ({galleryImages.filter(img => img.category === category).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative cursor-pointer"
              onClick={() => setSelectedImage(index)}
            >
              <div className="relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-32 sm:h-48 md:h-64 object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
                  <div className="p-2 md:p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(image.category)}`}>
                      {getCategoryLabel(image.category)}
                    </span>
                    <p className="text-xs md:text-sm">{image.alt}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 md:p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-8 md:-top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
              >
                <X size={24} className="md:w-8 md:h-8" />
              </button>
              
              <img
                src={filteredImages[selectedImage].src}
                alt={filteredImages[selectedImage].alt}
                className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 md:p-4 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-3 ${getCategoryColor(filteredImages[selectedImage].category)}`}>
                      {getCategoryLabel(filteredImages[selectedImage].category)}
                    </span>
                    <span className="text-xs md:text-sm">{filteredImages[selectedImage].alt}</span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-300">
                    {selectedImage + 1} of {filteredImages.length}
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons */}
              {selectedImage > 0 && (
                <button
                  onClick={() => setSelectedImage(selectedImage - 1)}
                  className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 md:p-3 transition-colors text-lg md:text-xl"
                >
                  ←
                </button>
              )}
              
              {selectedImage < filteredImages.length - 1 && (
                <button
                  onClick={() => setSelectedImage(selectedImage + 1)}
                  className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 md:p-3 transition-colors text-lg md:text-xl"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Gallery Stats */}
        <div className="mt-8 md:mt-16 bg-white rounded-xl shadow-lg p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-center text-slate-900 mb-6 md:mb-8">Gallery Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {categories.slice(1).map(category => {
              const count = galleryImages.filter(img => img.category === category).length;
              return (
                <div key={category}>
                  <div className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">{count}</div>
                  <div className="text-xs md:text-base text-slate-600">{getCategoryLabel(category)} Photos</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;