import React, { useState } from "react";

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

  // Change these to your Cloudinary details
  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/mycloudasif/image/upload"; // Replace
  const UPLOAD_PRESET = "unsigned_preset"; // Replace

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

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
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const API_URL =
        process.env.NODE_ENV === "development"
          ? "/.netlify/functions/addNews"
          : "/.netlify/functions/addNews";

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add news");
      }

      setSuccess("News added successfully!");
      setForm({
        title: "",
        description: "",
        image_url: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto p-6 bg-white shadow rounded space-y-6"
        >
          <h2 className="text-3xl font-bold mb-6">Add News</h2>

          {error && <p className="text-red-600">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}

          <div>
            <label className="block mb-1 font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded"
              placeholder="Enter news title"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              required
              className="w-full p-3 border rounded"
              placeholder="Enter full news description"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />
            {uploadingImage && (
              <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
            )}
            {form.image_url && (
              <img
                src={form.image_url}
                alt="News preview"
                className="mt-3 max-w-xs rounded shadow"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Adding..." : "Add News"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNews;
