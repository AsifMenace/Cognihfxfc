import React, { useState, useEffect } from "react";
import { X, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
type GalleryProps = {
  isAdmin: boolean;
};

const Gallery: React.FC<GalleryProps> = ({ isAdmin }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Upload form states
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("match");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const categories = ["all", "match", "training", "celebration", "team"];

  const [showAddForm, setShowAddForm] = useState(false);

  // Replace with your Cloudinary info
  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/mycloudasif/image/upload";
  const UPLOAD_PRESET = "unsigned_preset";

  const API_BASE =
    process.env.NODE_ENV === "development"
      ? "https://feature-vs-new--cognihfxfc.netlify.app/.netlify/functions"
      : "/.netlify/functions";

  // Fetch gallery data
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

  const getCategoryLabel = (category: string) =>
    category.charAt(0).toUpperCase() + category.slice(1);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "match":
        return "bg-blue-100 text-blue-800";
      case "training":
        return "bg-green-100 text-green-800";
      case "celebration":
        return "bg-yellow-100 text-yellow-800";
      case "team":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle image upload
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
        setError(err.message);
      } else setError("An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      const res = await fetch(`${API_BASE}/deleteGalleryPhoto`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete photo");
      }

      // Update local state
      setGalleryImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        alert(`Error deleting photo: ${err.message}`);
      } else setError("An unexpected error occurred.");
    }
  };

  // Handle save to DB
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/addGalleryPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, caption, category }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save photo");
      }
      setMessage("Photo added!");
      setCaption("");
      setCategory("match");
      setImageUrl("");
      // Refresh gallery from DB
      const updated = await fetch("/.netlify/functions/getGallery").then((r) =>
        r.json()
      );
      setGalleryImages(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {/* PAGE HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Photo Gallery
          </h1>
          <p className="text-lg text-slate-600">
            Capturing our amazing moments on and off the pitch
          </p>
        </div>

        {/* UPLOAD FORM */}
        <button
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
          onClick={() => {
            if (!isAdmin) {
              navigate("/admin-login"); // client-side navigation—no reload!
            } else {
              setShowAddForm((prev) => !prev);
            }
          }}
        >
          + Add Photo
        </button>
        {isAdmin && showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 rounded shadow mb-8"
          >
            <h2 className="text-lg font-bold mb-3">Add to Gallery</h2>
            {error && <p className="text-red-600">{error}</p>}
            {message && <p className="text-green-600">{message}</p>}

            {/* File upload (styled label triggers hidden input) */}
            <div className="flex items-center">
              <label
                htmlFor="gallery-file"
                className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700"
              >
                Choose File
              </label>
              <input
                id="gallery-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                required
              />
              <span className="ml-3 text-gray-600">
                {/* This shows status next to button */}
                {imageUrl ? "File selected" : "No file chosen"}
              </span>
            </div>

            {uploading && <p className="text-blue-500 mt-1">Uploading...</p>}
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="mt-2 w-32 rounded" />
            )}

            <input
              type="text"
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="block w-full border p-2 rounded mt-3"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full border p-2 rounded mt-3"
            >
              <option value="match">Match</option>
              <option value="training">Training</option>
              <option value="celebration">Celebration</option>
              <option value="team">Team</option>
            </select>
            <button
              type="submit"
              disabled={saving || uploading || !imageUrl}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Add Photo"}
            </button>
          </form>
        )}

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 mb-6">
          <Filter className="text-slate-600 mr-1" size={18} />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === cat
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-slate-600 hover:bg-slate-100 shadow-sm"
              }`}
            >
              {getCategoryLabel(cat)}
              {cat !== "all" && (
                <span className="ml-1 text-xs opacity-75">
                  ({galleryImages.filter((img) => img.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* IMAGE GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredImages.map((image, index) => (
            <div key={image.id} className="group relative">
              {/* Delete button */}
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the lightbox from opening
                    handleDelete(image.id);
                  }}
                  title="Delete photo"
                  className="absolute top-2 right-2 z-10 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  ✕
                </button>
              )}

              {/* Image Card */}
              <div
                className="relative cursor-pointer overflow-hidden rounded-xl bg-white shadow hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image.image_url}
                  alt={image.caption}
                  className="w-full h-32 sm:h-48 md:h-64 object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end">
                  <div className="p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(
                        image.category
                      )}`}
                    >
                      {getCategoryLabel(image.category)}
                    </span>
                    <p className="text-xs">{image.caption}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LIGHTBOX */}
        {selectedImage !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X size={28} />
              </button>
              <img
                src={filteredImages[selectedImage].image_url}
                alt={filteredImages[selectedImage].caption}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
