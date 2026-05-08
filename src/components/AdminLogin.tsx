import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type AdminLoginProps = {
  setIsAdmin: (isAdmin: boolean) => void;
};

export function AdminLogin({ setIsAdmin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/.netlify/functions/adminLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem("adminToken", password);
        setIsAdmin(true);
        const intendedPath = location.state?.intended || "/";
        navigate(intendedPath, { replace: true });
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-2 rounded w-full disabled:bg-blue-300"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}
