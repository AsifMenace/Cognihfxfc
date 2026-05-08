import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminHeaders } from '../utils/auth';

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
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    setUploadingImage(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', files[0]);
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
        headers: getAdminHeaders(),
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
      if (!res.ok) throw new Error(resData.error || 'Update failed');

      setSuccess('Player updated successfully!');
      setTimeout(() => navigate(`/player/${form.id}`), 1000);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";
  const sectionLabelCls = "text-xs font-black text-yellow-400 uppercase tracking-widest mb-4 pt-2";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <div className="text-2xl font-black text-yellow-400 animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">EDIT PLAYER</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-4 shadow-2xl"
        >
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          {/* Player Info */}
          <p className={sectionLabelCls}>Player Info</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Position</label>
              <select name="position" value={form.position} onChange={handleChange} required className={inputCls}>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Jersey Number</label>
              <input type="number" name="jerseyNumber" value={form.jerseyNumber} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Age</label>
              <input type="number" name="age" value={form.age} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nationality</label>
              <input type="text" name="nationality" value={form.nationality} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Height</label>
              <input type="text" name="height" value={form.height} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              <input type="text" name="weight" value={form.weight} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          {/* Statistics */}
          <div className="border-t border-slate-700 pt-4">
            <p className={sectionLabelCls}>Statistics</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Goals</label>
                <input type="number" name="goals" value={form.goals} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Assists</label>
                <input type="number" name="assists" value={form.assists} onChange={handleChange} className={inputCls} />
              </div>
              {form.position === 'Goalkeeper' && (
                <div>
                  <label className={labelCls}>Saves</label>
                  <input type="number" name="saves" value={form.saves} onChange={handleChange} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Appearances</label>
                <input type="number" name="appearances" value={form.appearances} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Skill Level (1–10)</label>
                <input type="number" name="skill" value={form.skill || ''} onChange={handleChange} min="1" max="10" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="border-t border-slate-700 pt-4">
            <p className={sectionLabelCls}>Contact & Location</p>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="tel" name="contact" placeholder="e.g. 9056928230" value={form.contact} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Street Address</label>
                <input type="text" name="address" placeholder="e.g. 5670 Spring Garden Road" value={form.address} onChange={handleChange} className={inputCls} />
                <p className="text-xs text-gray-500 mt-1">Halifax, NS appended automatically. Saving a new address updates the map pin.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" name="hasCar" checked={form.hasCar} onChange={handleChange} className="w-4 h-4 accent-yellow-400" />
                <span className="text-gray-300 font-medium">Has a car</span>
              </label>
            </div>
          </div>

          {/* Photo & Bio */}
          <div className="border-t border-slate-700 pt-4">
            <p className={sectionLabelCls}>Photo & Bio</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Player Photo</label>
                <label className="flex items-center gap-4 cursor-pointer mt-1">
                  <span className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition text-sm">
                    Choose File
                  </span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <span className="text-gray-400 text-sm">{uploadingImage ? 'Uploading...' : 'Replace photo'}</span>
                </label>
                {uploadingImage && <p className="text-cyan-400 text-sm mt-2">Uploading...</p>}
                {form.photo && <img src={form.photo} alt="Preview" className="mt-3 w-32 h-40 object-cover rounded-lg shadow-lg" />}
              </div>
              <div>
                <label className={labelCls}>Bio</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Short player bio..." className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all disabled:opacity-50 mt-2"
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPlayer;
