import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Player {
  id: number;
  name: string;
  position: string;
  age: number;
  nationality: string;
  jerseyNumber: number;
  height: string;
  weight: string;
  goals: number;
  assists: number;
  saves: number;
  appearances: number;
  skill: number;
  photo: string;
  bio: string;
  address: string;
  hasCar: boolean;
  contact: string;
}

const EditPlayer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/mycloudasif/image/upload';
  const UPLOAD_PRESET = 'unsigned_preset';

  const BASE_URL = '/.netlify/functions';

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`${BASE_URL}/getPlayerById?id=${id}`);
        if (!res.ok) throw new Error('Failed to fetch player');
        const data: Player = await res.json();
        // Ensure new fields have safe defaults if not yet in DB
        setForm({
          ...data,
          address: data.address ?? '',
          hasCar: data.hasCar ?? false,
          contact: data.contact ?? '',
        });
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [BASE_URL, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return;
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm({ ...form, [target.name]: target.checked });
    } else {
      setForm({ ...form, [target.name]: target.value } as Player);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingImage(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Image upload failed');
      const data = await res.json();
      setForm({ ...form, photo: data.secure_url });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${BASE_URL}/updatePlayer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          jerseyNumber: Number(form.jerseyNumber),
          goals: Number(form.goals),
          assists: Number(form.assists),
          appearances: Number(form.appearances),
          skill: Number(form.skill),
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        // Surface geocoding errors clearly to the admin
        throw new Error(resData.error || 'Update failed');
      }

      setSuccess('Player updated successfully!');
      setTimeout(() => navigate(`/player/${form.id}`), 1000);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading player data...</div>;
  if (error && !form) return <div className="p-4 text-red-600">{error}</div>;
  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-white shadow rounded p-4 space-y-4"
        >
          <h2 className="text-2xl font-bold">Edit Player</h2>
          {success && <p className="text-green-600">{success}</p>}
          {error && <p className="text-red-600">{error}</p>}

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="w-full border p-2 rounded"
          />
          <input
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder="Position"
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            placeholder="Age"
            required
            className="w-full border p-2 rounded"
          />
          <input
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
            placeholder="Nationality"
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            name="jerseyNumber"
            value={form.jerseyNumber}
            onChange={handleChange}
            placeholder="Jersey Number"
            required
            className="w-full border p-2 rounded"
          />
          <input
            name="height"
            value={form.height}
            onChange={handleChange}
            placeholder="Height"
            className="w-full border p-2 rounded"
          />
          <input
            name="weight"
            value={form.weight}
            onChange={handleChange}
            placeholder="Weight"
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            name="goals"
            value={form.goals}
            onChange={handleChange}
            placeholder="Goals"
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            name="assists"
            value={form.assists}
            onChange={handleChange}
            placeholder="Assists"
            className="w-full border p-2 rounded"
          />
          <div>
            {form.position === 'Goalkeeper' && (
              <input
                type="number"
                name="saves"
                value={form.saves}
                onChange={handleChange}
                placeholder="Saves"
                className="w-full border p-2 rounded"
              />
            )}
            <input
              type="number"
              name="appearances"
              value={form.appearances}
              onChange={handleChange}
              placeholder="Appearances"
              className="w-full border p-2 rounded"
            />
            <label className="block mb-1 font-medium">Skill Level (1-10)</label>
            <input
              type="number"
              name="skill"
              value={form.skill || ''}
              onChange={handleChange}
              placeholder="Skill (1-10)"
              min="1"
              max="10"
              className="w-full border p-2 rounded"
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
              className="w-full border p-2 rounded"
            />

            <input
              type="text"
              name="address"
              placeholder="Street address (e.g. 5670 Spring Garden Road)"
              value={form.address}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            <p className="text-xs text-slate-400 -mt-2">
              Halifax, NS is appended automatically for map geocoding. Saving a new address will
              update the map pin.
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

          {/* Image */}
          <div>
            <label className="block mb-1 font-medium">Player Photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {uploadingImage && <p className="text-blue-600">Uploading image...</p>}
            {form.photo && <img src={form.photo} alt="Preview" className="mt-2 max-w-xs rounded" />}
          </div>

          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Bio"
            rows={4}
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPlayer;
