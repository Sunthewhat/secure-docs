import { FC } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoDocumentTextOutline } from "react-icons/io5";
import clsx from "clsx";
import { useAuth } from "@/context/auth/useAuth";

const TopBar: FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  

  return (
    <div className="bg-black px-6 h-20 flex flex-row justify-between">
      {/* Left: Logo + nav */}
      <div className="flex flex-row items-center gap-2">
        <IoDocumentTextOutline size={30} className="text-white" />
        <h1
          className="text-2xl font-bold text-white font-adlam cursor-pointer text-[25px]"
          onClick={() => {
            void navigate("/");
          }}
        >
          EasyCert
        </h1>

        {/* Nav Links */}
        <div className="flex flex-row px-18 gap-15">
          {[
            { path: "/", label: "Home" },
            { path: "/design", label: "Design" },
            { path: "/share", label: "Share" },
            { path: "/history", label: "History" },
          ].map(({ path, label }) => (
            <button
              key={path}
              // variant="link"
              className={clsx(
                "hover:underline p-0 h-auto font-noto font-semibold text-[18px]",
                isActive(path) ? "text-white" : "text-gray-400"
              )}
              onClick={() => void navigate(path)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Auth status */}
      <div className="flex flex-row items-center gap-2">
        {auth.user ? (
          <>
            <span className="text-white">
              Logged in as {auth.user.username}
            </span>
            <button
              onClick={() => {
                auth.signout(() => {
                  void navigate("/");
                });
              }}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            className="text-white"
            onClick={() => {
              void navigate("/login");
            }}
          >
            Log in
          </button>
        )}
      </div>
    </div>
  );
};

export { TopBar };
