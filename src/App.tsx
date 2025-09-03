import { AuthProvider } from "./context/auth/authProvider";
import { RouterProvider } from "./routes/routerProvider";
import { ToastProvider } from "@/components/toast/ToastContext";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
