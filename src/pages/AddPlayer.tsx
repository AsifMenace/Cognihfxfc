import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const AddPlayer: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    position: '',
    age: '',
    nationality: '',
    jerseyNumber: '',
    height: '',
    weight: '',
    goals: '',
    assists: '',
    appearances: '',
    skill: '',
    photo: '',
    bio: '',
    address: '',
    hasCar: false,
    contact: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/mycloudasif/image/upload';
  const UPLOAD_PRESET = 'unsigned_preset';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm({ ...form, [target.name]: target.checked });
    } else {
      setForm({ ...form, [target.name]: target.value });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Image upload failed');

      const data = await response.json();
      setForm((prev) => ({ ...prev, photo: data.secure_url }));
      setSuccess('Image uploaded successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const body = {
      ...form,
      age: Number(form.age),
      jerseyNumber: Number(form.jerseyNumber),
      goals: Number(form.goals) || 0,
      assists: Number(form.assists) || 0,
      appearances: Number(form.appearances) || 0,
      skill: form.skill ? Number(form.skill) : undefined,
      hasCar: form.hasCar,
      contact: form.contact,
      address: form.address,
    };

    try {
      const res = await fetch('/.netlify/functions/addPlayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add player');
      }

      setSuccess('Player added successfully!');
      setForm({
        name: '',
        position: '',
        age: '',
        nationality: '',
        jerseyNumber: '',
        height: '',
        weight: '',
        goals: '',
        assists: '',
        appearances: '',
        skill: '',
        photo: '',
        bio: '',
        address: '',
        hasCar: false,
        contact: '',
      });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto p-4 bg-white shadow rounded space-y-4"
        >
          <h2 className="text-2xl font-bold mb-4">Add New Player</h2>

          {error && <p className="text-red-600">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <select
            name="position"
            value={form.position}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          >
            <option value="" disabled>
              Select Position
            </option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
          </select>

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            name="nationality"
            placeholder="Nationality"
            value={form.nationality}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="jerseyNumber"
            placeholder="Jersey Number"
            value={form.jerseyNumber}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            name="height"
            placeholder="Height"
            value={form.height}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            name="weight"
            placeholder="Weight"
            value={form.weight}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="goals"
            placeholder="Goals"
            value={form.goals}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="assists"
            placeholder="Assists"
            value={form.assists}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="appearances"
            placeholder="Appearances"
            value={form.appearances}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <div>
            <label className="block mb-1 font-medium">Skill Level (1-10)</label>
            <input
              type="number"
              name="skill"
              placeholder="Skill (1-10)"
              value={form.skill}
              onChange={handleChange}
              min="1"
              max="10"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Contact & Location */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-slate-700">Contact & Location</h3>

            <input
              type="tel"
              name="contact"
              placeholder="Phone number (e.g. 9056928230)"
              value={form.contact}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />

            <input
              type="text"
              name="address"
              placeholder="Street address (e.g. 5670 Spring Garden Road)"
              value={form.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <p className="text-xs text-slate-400 -mt-2">
              Halifax, NS is appended automatically for map geocoding.
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasCar"
                checked={form.hasCar}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="font-medium text-slate-700">Has a car</span>
            </label>
          </div>

          {/* Image upload */}
          <div>
            <label className="block mb-1 font-medium">Upload Player Photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
            {uploadingImage && <p className="text-sm text-blue-600 mt-1">Uploading image...</p>}
            {form.photo && (
              <img src={form.photo} alt="Player preview" className="mt-2 max-w-xs rounded" />
            )}
          </div>

          <textarea
            name="bio"
            placeholder="Bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border rounded"
          />

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Adding...' : 'Add Player'}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link
            to="/squad"
            className="inline-block px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
          >
            ← Back to Squad
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AddPlayer;
