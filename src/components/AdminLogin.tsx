import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_PASSWORD } from "../Config";

type AdminLoginProps = {
  setIsAdmin: (isAdmin: boolean) => void;
};

export function AdminLogin({ setIsAdmin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError(null);
      setIsAdmin(true); // Notify parent about successful login
      navigate("/"); // or redirect to intended admin page
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        className="border p-2 rounded mr-2"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-3 py-2 rounded"
      >
        Login
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </form>
  );
}
