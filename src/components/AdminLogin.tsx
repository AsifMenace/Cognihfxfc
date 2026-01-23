import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 👈 Added useLocation
import { ADMIN_PASSWORD } from "../Config";

type AdminLoginProps = {
  setIsAdmin: (isAdmin: boolean) => void;
};

export function AdminLogin({ setIsAdmin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Reads intended path

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError(null);
      setIsAdmin(true);

      // 👈 Smart redirect!
      const intendedPath = location.state?.intended || "/";
      navigate(intendedPath, { replace: true });
    } else {
      setError("Incorrect password");
    }
  };

  // Rest of component EXACTLY same...
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <label htmlFor="admin-password" className="block mb-2 font-bold">
          Admin Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="border p-2 rounded w-full mb-4"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-2 rounded w-full"
        >
          Login
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}
