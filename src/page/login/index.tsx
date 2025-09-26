"use client";

import React, { useEffect, useRef, useState } from "react";
import { LoginResponse } from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import EasyCertLogo from "../../asset/EasyCertLogo.svg";

// Login page (public)

const BACKGROUND_VIDEO_URL =
  "https://easy-cert-storage.sunthewhat.com/easy-cert-internal-resource/Background_video.mp4";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const auth = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await Axios.post<LoginResponse>("/auth/login", {
        username: username,
        password: password,
      });

      console.log(username, password);
      console.log(response);
      if (response.status !== 200) {
        alert(response.data.msg);
        return;
      }

      // Set authentication state with user data and navigate to home page
      auth.signin(response.data.data, () => {
        void navigate("/");
      });
    } catch (error: unknown) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden font-noto">
      <video
        ref={videoRef}
        src={BACKGROUND_VIDEO_URL}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center p-6">
        <img
          src={EasyCertLogo}
          alt="EasyCert logo"
          className="mb-5 h-[150px]"
        />
        <div className="w-full max-w-md rounded-2xl p-[32px] shadow-md bg-[rgb(0,0,0,0.25)] backdrop-blur-2xl">
          <h2 className="text-center font-bold text-white text-[25px] rounded-3xl mb-8">
            Login
          </h2>
          {/* <p className="mb-4">You must log in first.</p> */}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(e);
            }}
            className="space-y-8"
          >
            <div>
              <input
                name="username"
                type="text"
                className="w-full border p-3 rounded-xl bg-[rgb(255,255,255,0.2)] placeholder-[#C8C8C8]"
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                autoComplete={"username"}
                required
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="w-full border p-3 rounded-xl bg-[rgb(255,255,255,0.2)] placeholder-[#C8C8C8]"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                autoComplete={"current-password"}
                required
              />
            </div>
            <div className="flex justify-center mt-8">
              <button type="submit" className="bg-white w-full px-4 py-2 rounded-2xl">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
