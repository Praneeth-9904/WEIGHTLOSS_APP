import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ isAuth, setIsAuth }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    navigate("/");
  };

  return (
    <nav className="bg-teal-700 p-4 shadow-md text-white">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold tracking-wide">Diet AI</Link>
        <div className="space-x-6 font-medium flex items-center">
          <Link to="/" className="hover:text-teal-200 transition">Home</Link>
          <Link to="/about" className="hover:text-teal-200 transition">About</Link>
          
          {isAuth ? (
            <>
              <Link to="/app" className="hover:text-teal-200 transition">AI Planner</Link>
              <Link to="/log" className="hover:bg-teal-400 transition text-white">Log Food</Link>
              <button onClick={handleLogout} className="text-red-300 hover:text-red-100 transition">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-teal-200 transition">Login</Link>
              <Link to="/register" className="bg-white text-teal-700 px-3 py-1 rounded hover:bg-gray-100 transition">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}