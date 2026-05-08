import React, { useState } from "react";
import { getAdminHeaders } from "../utils/auth";

const AddNews: React.FC = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/mycloudasif/image/upload";
  const UPLOAD_PRESET = "unsigned_preset";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      setForm((prev) => ({ ...prev, image_url: data.secure_url }));
      setSuccess("Image uploaded successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unexpected error during image upload.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.description) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/.netlify/functions/addNews", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add news");
      }

      setSuccess("News added successfully!");
      setForm({ title: "", description: "", image_url: "" });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">ADD NEWS</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-5 shadow-2xl"
        >
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <div>
            <label className={labelCls}>Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Enter news title"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              required
              placeholder="Enter full news description"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Upload Image (optional)</label>
            <label className="flex items-center gap-4 cursor-pointer mt-1">
              <span className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition text-sm">
                Choose File
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-gray-400 text-sm">
                {form.image_url ? "Image ready" : "No file selected"}
              </span>
            </label>
            {uploadingImage && (
              <p className="text-cyan-400 text-sm mt-2">Uploading to Cloudinary...</p>
            )}
            {form.image_url && (
              <img src={form.image_url} alt="Preview" className="mt-3 w-48 rounded-lg shadow-lg" />
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? "ADDING..." : "ADD NEWS"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNews;
