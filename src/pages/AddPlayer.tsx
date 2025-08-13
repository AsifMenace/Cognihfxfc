import React, { useState } from 'react';

const AddPlayerForm: React.FC = () => {
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
    photo: '',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL =
    process.env.NODE_ENV === 'development'
      ? 'https://db-integration--cognihfxfc.netlify.app/.netlify/functions/addPlayer'
      : '/.netlify/functions/addPlayer';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Prepare data, convert numbers where needed
    const body = {
      ...form,
      age: Number(form.age),
      jerseyNumber: Number(form.jerseyNumber),
      height: form.height,
      weight: form.weight,
      goals: Number(form.goals) || 0,
      assists: Number(form.assists) || 0,
      appearances: Number(form.appearances) || 0,
      bio: form.bio,
    };

    try {
      const res = await fetch(API_URL, {
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
        photo: '',
        bio: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 bg-white shadow rounded space-y-4">
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
      <input
        type="text"
        name="position"
        placeholder="Position"
        value={form.position}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />
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
      <input
        type="url"
        name="photo"
        placeholder="Photo URL from Cloudinary"
        value={form.photo}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />
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
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? 'Adding...' : 'Add Player'}
      </button>
    </form>
  );
};

export default AddPlayerForm;
