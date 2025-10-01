import { Outlet } from "react-router-dom";
import { TopBar } from "../topBar";

const BACKGROUND_VIDEO_URL =
  "https://easy-cert-storage.sunthewhat.com/easy-cert-internal-resource/Background_video.mp4";

/**
 * Layout component that includes navigation and auth status
 */
const Layout = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden font-noto">
      <video
        src={BACKGROUND_VIDEO_URL}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <TopBar />
        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export { Layout };
