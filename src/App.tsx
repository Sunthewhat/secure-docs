import { AuthProvider } from './context/auth/authProvider';
import { RouterProvider } from './routes/routerProvider';

function App() {
	return (
		<AuthProvider>
			<RouterProvider />
		</AuthProvider>
	);
}

export default App;
