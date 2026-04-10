// 🔹 React & Libraries
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// 🔹 Set base URL for all axios requests
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

// 🔹 Create Context
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // 🔹 Global States
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  const [token, setToken] = useState(
    localStorage.getItem("token") || null
  );
  const [loadingUser, setLoadingUser] = useState(true);

  // =========================================================
  // 🔐 Fetch Logged-in User
  // Gets user data using stored token
  // =========================================================
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      if (err.response?.status === 401) logout();
      console.error("Auth Error:", err.message);
    } finally {
      setLoadingUser(false);
    }
  };

  // =========================================================
  // 🚪 Logout User
  // Clears all stored data and redirects to login
  // =========================================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedChatId");

    setToken(null);
    setUser(null);
    setChats([]);
    setSelectedChat(null);

    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  // =========================================================
  // 💬 Create New Chat
  // Creates a chat and sets it as active
  // =========================================================
  const createNewChat = async () => {
    try {
      if (!user) return toast.error("Please login first");

      const { data } = await axios.post(
        "/api/chat/create",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        const newChat = data.chat;

        // fallback if backend doesn't return chat
        await fetchUsersChats();

        setChats((prev) => {
          if (newChat) {
            setSelectedChat(newChat);
            localStorage.setItem("selectedChatId", newChat._id);
          } else if (prev.length > 0) {
            const latest = prev[prev.length - 1];
            setSelectedChat(latest);
            localStorage.setItem("selectedChatId", latest._id);
          }
          return prev;
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // =========================================================
  // 📥 Fetch All User Chats
  // Handles chat selection logic (current, saved, fallback)
  // =========================================================
  const fetchUsersChats = async () => {
    try {
      const { data } = await axios.get("/api/chat/fetch", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const fetchedChats = data.chats || [];
        setChats(fetchedChats);

        // if no chats → create one automatically
        if (fetchedChats.length === 0) {
          await createNewChat();
          return;
        }

        const savedId = localStorage.getItem("selectedChatId");

        setSelectedChat((prev) => {
          // 1️⃣ Keep current chat if it still exists
          const stillExists = fetchedChats.find(
            (c) => c._id === prev?._id
          );
          if (stillExists) return stillExists;

          // 2️⃣ Try restoring from localStorage
          const savedChat = fetchedChats.find(
            (c) => c._id === savedId
          );
          if (savedChat) return savedChat;

          // 3️⃣ Default to first chat
          return fetchedChats[0];
        });
      }
    } catch (err) {
      console.error("Chat Fetch Error:", err.message);
    }
  };

  // =========================================================
  // 💾 Persist Selected Chat in localStorage
  // =========================================================
  useEffect(() => {
    if (selectedChat?._id) {
      localStorage.setItem("selectedChatId", selectedChat._id);
    }
  }, [selectedChat]);

  // =========================================================
  // 🎨 Theme Management (Dark / Light)
  // =========================================================
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // =========================================================
  // 👤 When User or Token Changes
  // Fetch chats or reset state
  // =========================================================
  useEffect(() => {
    if (user && token) {
      fetchUsersChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user, token]);

  // =========================================================
  // 🔁 Initialize User from Token (on app load)
  // =========================================================
  useEffect(() => {
    const init = async () => {
      if (token) {
        await fetchUser();
      } else {
        setUser(null);
        setLoadingUser(false);
      }
    };

    init();
  }, [token]);

  // =========================================================
  // 🌐 Context Value (Global Access)
  // =========================================================
  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    loadingUser,
    fetchUsersChats,
    token,
    setToken,
    logout,
    axios,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// 🔹 Custom Hook for easy context usage
export const useAppContext = () => useContext(AppContext);