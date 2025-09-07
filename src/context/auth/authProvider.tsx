import { User } from '@/types/context';
import { ReactNode, useState, FC, useEffect } from 'react';
import { AuthContext } from './authContext';
import { Axios, startTokenRefresh, stopTokenRefresh } from '@/util/axiosInstance';
import { useNavigate } from 'react-router';

// Provider component that wraps the app and makes auth available
const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const navigator = useNavigate();
	const [user, setUser] = useState<User | null>(() => {
		// Initialize user state from localStorage immediately
		const savedUserData = localStorage.getItem('userData');
		if (savedUserData) {
			try {
				return JSON.parse(savedUserData) as User;
			} catch {
				// Clear invalid data
				localStorage.removeItem('userData');
				localStorage.removeItem('authToken');
				return null;
			}
		}
		return null;
	});

	const handleVerify = async () => {
		const path = window.location.pathname;

		if (path.startsWith('/login') || path.startsWith('/validate')) {
			return;
		}

		const response = await Axios.get('/auth/verify');
		if (response.status != 200) {
			navigator('/login', { replace: true });
		}
	};

	// Start token refresh if user is already logged in
	useEffect(() => {
		handleVerify();
		if (user) {
			startTokenRefresh(navigator);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Sign in handler
	const signin = (userData: User, callback: VoidFunction) => {
		setUser(userData);
		// Store token in localStorage for persistence
		localStorage.setItem('authToken', userData.token);
		localStorage.setItem('userData', JSON.stringify(userData));
		startTokenRefresh(navigator);
		callback();
	};

	// Sign out handler
	const signout = (callback: VoidFunction) => {
		setUser(null);
		// Clear stored data
		localStorage.removeItem('authToken');
		localStorage.removeItem('userData');
		stopTokenRefresh();
		callback();
	};

	const value = { user, signin, signout };

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
