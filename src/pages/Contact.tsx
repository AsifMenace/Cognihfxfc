import React, { useState, ChangeEvent, FormEvent } from 'react';

const Contact: React.FC = () => {
  interface FormData {
    name: string;
    email: string;
    message: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert(`Thank you, ${formData.name}! Your message has been sent.`);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl text-slate-600 px-4">
            We’d love to hear from the fans! Send us your messages below.
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white shadow-md rounded-lg p-6 space-y-6"
        >
          <div>
            <label htmlFor="name" className="block mb-2 font-semibold text-slate-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-2 font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          <div>
            <label htmlFor="message" className="block mb-2 font-semibold text-slate-700">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;