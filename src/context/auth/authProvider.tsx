import { User } from '@/types/context';
import { ReactNode, useState, FC, useEffect } from 'react';
import { AuthContext } from './authContext';

// Provider component that wraps the app and makes auth available
const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);

	// Restore user data from localStorage on app load
	useEffect(() => {
		const savedUserData = localStorage.getItem('userData');
		if (savedUserData) {
			try {
				const userData = JSON.parse(savedUserData) as User;
				setUser(userData);
			} catch {
				// Clear invalid data
				localStorage.removeItem('userData');
				localStorage.removeItem('authToken');
			}
		}
	}, []);

	// Sign in handler
	const signin = (userData: User, callback: VoidFunction) => {
		setUser(userData);
		// Store token in localStorage for persistence
		localStorage.setItem('authToken', userData.token);
		localStorage.setItem('userData', JSON.stringify(userData));
		callback();
	};

	// Sign out handler
	const signout = (callback: VoidFunction) => {
		setUser(null);
		// Clear stored data
		localStorage.removeItem('authToken');
		localStorage.removeItem('userData');
		callback();
	};

	const value = { user, signin, signout };

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
