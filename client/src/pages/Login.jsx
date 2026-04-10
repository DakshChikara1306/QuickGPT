import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// 🔹 Context
import { useAppContext } from "../context/AppContext";

const Login = () => {
  // 🔹 Form mode: login / register
  const [state, setState] = useState("login");

  // 🔹 Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🔹 Global context
  const { axios, setToken } = useAppContext();

  // 🔹 Navigation
  const navigate = useNavigate();

  // =========================================================
  // 🚀 Handle form submit (login / register)
  // Sends request based on current state
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url =
      state === "login"
        ? "/api/user/login"
        : "/api/user/register";

    try {
      // 📦 Payload based on mode
      const payload =
        state === "login"
          ? { email, password }
          : { name, email, password };

      const { data } = await axios.post(url, payload);

      if (data.success) {
        // 🔐 Save token in localStorage + context
        localStorage.setItem("token", data.token);
        setToken(data.token);

        // 🔔 Success message
        toast.success(
          state === "login"
            ? "Login successful"
            : "Account created"
        );

        // 🔁 Redirect to home
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-88 text-gray-500 rounded-lg shadow-xl border border-gray-200 bg-white"
    >
      {/* 🧾 Title */}
      <p className="text-2xl font-medium m-auto">
        <span className="text-purple-700">User</span>{" "}
        {state === "login" ? "Login" : "Sign Up"}
      </p>

      {/* 👤 Name field (only for register) */}
      {state === "register" && (
        <div className="w-full">
          <p>Name</p>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
          />
        </div>
      )}

      {/* 📧 Email field */}
      <div className="w-full">
        <p>Email</p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
        />
      </div>

      {/* 🔑 Password field */}
      <div className="w-full">
        <p>Password</p>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
        />
      </div>

      {/* 🔁 Toggle between login & register */}
      {state === "register" ? (
        <p>
          Already have account?{" "}
          <span
            onClick={() => setState("login")}
            className="text-purple-700 cursor-pointer"
          >
            click here
          </span>
        </p>
      ) : (
        <p>
          Create an account?{" "}
          <span
            onClick={() => setState("register")}
            className="text-purple-700 cursor-pointer"
          >
            click here
          </span>
        </p>
      )}

      {/* 🚀 Submit button */}
      <button
        type="submit"
        className="bg-purple-600 hover:bg-purple-700 transition-all text-white w-full py-2 rounded-md"
      >
        {state === "login" ? "Login" : "Create Account"}
      </button>
    </form>
  );
};

export default Login;