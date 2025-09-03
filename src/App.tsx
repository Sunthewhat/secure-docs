import { AuthProvider } from "./context/auth/authProvider";
import { RouterProvider } from "./routes/routerProvider";
import { ToastProvider } from "@/components/toast/ToastContext";

function App() {
	return (
		<div className="select-none cursor-default">
			<ToastProvider>
				<AuthProvider>
					<RouterProvider />
				</AuthProvider>
			</ToastProvider>
		</div>
	);
}

export default App;
