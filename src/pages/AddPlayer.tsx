import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminHeaders } from '../utils/auth';

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
    runner: false,
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

      const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
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
    };

    try {
      const res = await fetch('/.netlify/functions/addPlayer', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add player');
      }

      setSuccess('Player added successfully!');
      setForm({
        name: '', position: '', age: '', nationality: '', jerseyNumber: '',
        height: '', weight: '', goals: '', assists: '', appearances: '',
        skill: '', photo: '', bio: '', address: '', hasCar: false, contact: '', runner: false,
      });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";
  const sectionLabelCls = "text-xs font-black text-yellow-400 uppercase tracking-widest mb-4 pt-2";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">ADD PLAYER</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-4 shadow-2xl"
        >
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          {/* Identity */}
          <p className={sectionLabelCls}>Player Info</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Name</label>
              <input type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Position</label>
              <select name="position" value={form.position} onChange={handleChange} required className={inputCls}>
                <option value="" disabled>Select position</option>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Jersey Number</label>
              <input type="number" name="jerseyNumber" placeholder="e.g. 9" value={form.jerseyNumber} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Age</label>
              <input type="number" name="age" placeholder="e.g. 24" value={form.age} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nationality</label>
              <input type="text" name="nationality" placeholder="e.g. Canadian" value={form.nationality} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Height</label>
              <input type="text" name="height" placeholder='e.g. 5&apos;11"' value={form.height} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              <input type="text" name="weight" placeholder="e.g. 75kg" value={form.weight} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-slate-700 pt-4">
            <p className={sectionLabelCls}>Statistics</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Goals</label>
                <input type="number" name="goals" placeholder="0" value={form.goals} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Assists</label>
                <input type="number" name="assists" placeholder="0" value={form.assists} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Appearances</label>
                <input type="number" name="appearances" placeholder="0" value={form.appearances} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Skill Level (1–10)</label>
                <input type="number" name="skill" placeholder="e.g. 7" min="1" max="10" value={form.skill} onChange={handleChange} className={inputCls} />
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
                <p className="text-xs text-gray-500 mt-1">Halifax, NS appended automatically for map geocoding.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" name="hasCar" checked={form.hasCar} onChange={handleChange} className="w-4 h-4 accent-yellow-400" />
                <span className="text-gray-300 font-medium">Has a car</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" name="runner" checked={form.runner} onChange={handleChange} className="w-4 h-4 accent-yellow-400" />
                <span className="text-gray-300 font-medium">🏃 Runner</span>
                <span className="text-xs text-gray-500">(used to balance runners across squads)</span>
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
                  <span className="text-gray-400 text-sm">{form.photo ? "Photo ready" : "No file selected"}</span>
                </label>
                {uploadingImage && <p className="text-cyan-400 text-sm mt-2">Uploading...</p>}
                {form.photo && <img src={form.photo} alt="Preview" className="mt-3 w-32 h-40 object-cover rounded-lg shadow-lg" />}
              </div>
              <div>
                <label className={labelCls}>Bio</label>
                <textarea name="bio" placeholder="Short player bio..." value={form.bio} onChange={handleChange} rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'ADDING...' : 'ADD PLAYER'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/squad"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold rounded-full hover:scale-105 transition-all shadow-lg"
          >
            ← Back to Squad
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AddPlayer;
