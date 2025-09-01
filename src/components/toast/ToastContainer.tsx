import { ReactNode } from "react";
import { createPortal } from "react-dom";

export default function ToastContainer({ children }: { children: ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-none">
      {children}
    </div>,
    document.body
  );
}
