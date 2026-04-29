import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ setIsAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("weightlossapp-production.up.railway.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      setIsAuth(true);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-teal-800 mb-6 text-center">Welcome Back</h2>
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-teal-600 text-white p-3 rounded font-bold hover:bg-teal-700 transition">Login</button>
      </form>
      <p className="mt-4 text-center text-sm">New user? <Link to="/register" className="text-teal-600 font-bold">Register here</Link></p>
    </div>
  );
}