import React, { useState, useEffect } from "react";
import { X, Filter, Upload, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type GalleryProps = {
  isAdmin: boolean;
};

type GalleryImage = {
  id: number;
  image_url: string;
  caption: string | null;
  category: "match" | "training" | "celebration" | "team";
  created_at?: string; // optional – whatever your DB returns
};

const Gallery: React.FC<GalleryProps> = ({ isAdmin }) => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Upload form
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("match");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ["all", "match", "training", "celebration", "team"];
  const navigate = useNavigate();

  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/mycloudasif/image/upload";
  const UPLOAD_PRESET = "unsigned_preset";
  const API_BASE =
    process.env.NODE_ENV === "development"
      ? "/.netlify/functions"
      : "/.netlify/functions";

  useEffect(() => {
    fetch(`${API_BASE}/getGallery`)
      .then((res) => res.json())
      .then((data) => setGalleryImages(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredImages =
    filter === "all"
      ? galleryImages
      : galleryImages.filter((image) => image.category === filter);

  const getCategoryLabel = (cat: string) =>
    cat.charAt(0).toUpperCase() + cat.slice(1);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "match":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/50";
      case "training":
        return "bg-green-500/20 text-green-300 border border-green-500/50";
      case "celebration":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50";
      case "team":
        return "bg-purple-500/20 text-purple-300 border border-purple-500/50";
      default:
        return "bg-gray-500/20 text-gray-300 border border-gray-500/50";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImageUrl(data.secure_url);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Upload failed");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this photo permanently?")) return;
    try {
      const res = await fetch(`${API_BASE}/deleteGalleryPhoto`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setGalleryImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Upload failed");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/addGalleryPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, caption, category }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Photo added!");
      setCaption("");
      setCategory("match");
      setImageUrl("");
      const updated = await fetch(`${API_BASE}/getGallery`).then((r) =>
        r.json()
      );
      setGalleryImages(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Upload failed");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-black text-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
            GALLERY
          </h1>
          <p className="text-xl text-gray-400">Moments frozen in time</p>
        </div>

        {/* Add Photo Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() =>
              isAdmin ? setShowAddForm(!showAddForm) : navigate("/admin-login")
            }
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold hover:scale-105 transition-all shadow-xl"
          >
            <Upload size={20} />
            Add Photo
          </button>
        </div>

        {/* Upload Form */}
        {isAdmin && showAddForm && (
          <div className="max-w-2xl mx-auto mb-12 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">
              Upload New Photo
            </h2>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            {message && <p className="text-green-400 mb-4">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Image
                </label>
                <label className="flex items-center gap-4 cursor-pointer">
                  <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition">
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <span className="text-gray-400">
                    {imageUrl ? "Ready to upload" : "No file selected"}
                  </span>
                </label>
                {uploading && (
                  <p className="text-cyan-400 mt-2">
                    Uploading to Cloudinary...
                  </p>
                )}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="mt-4 w-48 rounded-lg shadow-lg"
                  />
                )}
              </div>

              <input
                type="text"
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-yellow-500 focus:outline-none transition"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-yellow-500 focus:outline-none"
              >
                <option value="match">Match</option>
                <option value="training">Training</option>
                <option value="celebration">Celebration</option>
                <option value="team">Team</option>
              </select>

              <button
                type="submit"
                disabled={saving || uploading || !imageUrl}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Add to Gallery"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Filter size={20} className="text-gray-400" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
                filter === cat
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-xl scale-105"
                  : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/70 border border-slate-700"
              }`}
            >
              {getCategoryLabel(cat)}
              {cat !== "all" && (
                <span className="ml-2 opacity-75">
                  ({galleryImages.filter((i) => i.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-2xl cursor-zoom-in transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
              onClick={() => setSelectedImage(index)}
            >
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image.id);
                  }}
                  className="absolute top-3 right-3 z-10 p-2 bg-red-600/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <img
                src={image.image_url}
                alt={image.caption ?? `Gallery image ${image.id}`}
                className="w-full h-64 object-cover transition-all duration-700 group-hover:scale-110"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 w-fit ${getCategoryColor(
                    image.category
                  )}`}
                >
                  {getCategoryLabel(image.category)}
                </span>
                {image.caption && (
                  <p className="text-sm font-medium">{image.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <X size={32} />
            </button>
            <img
              src={filteredImages[selectedImage].image_url}
              alt={filteredImages[selectedImage].caption || "Gallery"}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
