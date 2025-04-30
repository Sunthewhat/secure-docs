import { AuthProvider } from './context/authContext';
import { RouterProvider } from './routes/routerProvider';

function App() {
	return (
		<AuthProvider>
			<RouterProvider />
		</AuthProvider>
	);
}

export default App;
