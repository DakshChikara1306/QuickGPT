import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 🔹 Components
import ChatBox from "./components/ChatBox";
import Sidebar from "./components/Sidebar";

// 🔹 Pages
import Credits from "./pages/Credits";
import Community from "./pages/Community";
import Loading from "./pages/Loading";
import Login from "./pages/Login";

// 🔹 Assets & Styles
import { assets } from "./assets/assets";
import "./assets/prism.css";

// 🔹 Context
import { useAppContext } from "./context/AppContext";

const App = () => {
  // 🔹 Global state from context
  const { user, loadingUser } = useAppContext();

  // 🔹 Local UI state (mobile sidebar toggle)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // 🔹 Current route path
  const { pathname } = useLocation();

  // =========================================================
  // ⏳ Show loading screen while user is being fetched
  // =========================================================
  if (pathname === "/loading" || loadingUser) {
    return <Loading />;
  }

  return (
    <>
      {/* 🔔 Toast notifications */}
      <Toaster />

      {/* 📱 Mobile menu button */}
      {!isMenuOpen && (
        <img
          src={assets.menu_icon}
          className="absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark:invert"
          onClick={() => setIsMenuOpen(true)}
        />
      )}

      {/* ===================================================== */}
      {/* 🔐 Auth-based Rendering */}
      {/* ===================================================== */}
      {user ? (
        // ✅ Logged-in Layout
        <div className="dark:bg-linear-to-b from-[#242124] to-[#000000] dark:text-white">
          <div className="flex h-screen w-screen">
            
            {/* 📂 Sidebar */}
            <Sidebar
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />

            {/* 🧭 Routes */}
            <Routes>
              <Route path="/" element={<ChatBox />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/community" element={<Community />} />
            </Routes>
          </div>
        </div>
      ) : (
        // 🔓 Not logged-in → Show login screen
        <div className="bg-linear-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen">
          <Login />
        </div>
      )}
    </>
  );
};

export default App;