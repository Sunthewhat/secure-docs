import { useEffect, useState } from "react";

type Props = {
  type: "success" | "error";
  message: string;
  duration?: number;
  onClose?: () => void;
};

export default function Toast({ type, message, duration = 3000, onClose }: Props) {
  const [closing, setClosing] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setClosing(true), duration);
    return () => clearTimeout(t);
  }, [duration]);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      setHidden(true);
      onClose?.();
    }, 220);
    return () => clearTimeout(t);
  }, [closing, onClose]);

  if (hidden) return null;

  const colors =
    type === "success"
      ? "bg-green-600 text-white"
      : "bg-red-600 text-white";

  const icon = type === "success" ? "✅" : "❌";

  return (
    <div
      className={`pointer-events-auto rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 
                  ${colors} ${closing ? "toast-exit" : "toast-enter"}`}
    >
      <span>{icon}</span>
      <span className="text-sm">{message}</span>
    </div>
  );
}
