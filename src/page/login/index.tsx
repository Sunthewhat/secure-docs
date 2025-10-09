"use client";

import React, { useEffect, useRef, useState } from "react";
import { LoginResponse } from "@/types/response";
import { Axios } from "@/util/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import EasyCertLogo from "../../asset/EasyCertLogo.svg";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

// Login page (public)

const BACKGROUND_VIDEO_URL =
  "https://easy-cert-storage.sunthewhat.com/easy-cert-internal-resource/Background_video.mp4";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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

      // Set authentication state with user data and navigate back to the original page
      auth.signin(response.data.data, () => {
        const from = (location.state as { from?: { pathname: string; search: string } })?.from;
        const redirectTo = from ? `${from.pathname}${from.search}` : "/";
        void navigate(redirectTo);
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
            className="space-y-8 text-white"
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
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full border p-3 pr-12 rounded-xl bg-[rgb(255,255,255,0.2)] placeholder-[#C8C8C8]"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                autoComplete={"current-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-white/80 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
            <div className="flex justify-center mt-8">
              <button
                type="submit"
                className="bg-white w-full px-4 py-2 rounded-2xl text-black"
              >
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
