import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LogFood from "./pages/LogFood";

export default function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(!!localStorage.getItem("token"));
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <Navbar isAuth={isAuth} setIsAuth={setIsAuth} />
        <main className="p-4 sm:p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            
            {/* Reverse Guards: If logged in, don't let them see Login/Register */}
            <Route path="/login" element={!isAuth ? <Login setIsAuth={setIsAuth} /> : <Navigate to="/app" />} />
            <Route path="/register" element={!isAuth ? <Register /> : <Navigate to="/app" />} />
            
            {/* Standard Guards: If NOT logged in, don't let them see the App */}
            <Route path="/app" element={isAuth ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/log" element={isAuth ? <LogFood /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}