"use client";

import React, { useState } from "react";
import { LoginResponse } from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useNavigate } from "react-router-dom";

// Login page (public)

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log("adsf");
      const response = await Axios.post<LoginResponse>("/auth/login", {
        username: username,
        password: password,
      });

      console.log(username, password);
      console.log(response);
      if (response.status !== 200) {
        alert(response.data.msg);
        return;
        // Redirect to home page on successful login
      }
      void navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center font-noto">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-70">
        <h2 className="text-center text-[25px] font-bold mb-4">Login</h2>
        {/* <p className="mb-4">You must log in first.</p> */}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="username" className="block mb-1">
              Username:
            </label>
            <input
              name="username"
              type="text"
              className="w-full border p-2 rounded"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1">
              Password:
            </label>
            <input
              name="password"
              type="password"
              className="w-full border p-2 rounded"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
          </div>
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="bg-primary_button text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { LoginPage };
