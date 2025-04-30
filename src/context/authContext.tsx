import { authService } from '@/util/auth';
import { createContext, useContext, ReactNode, useState, FC } from 'react';

interface AuthContextType {
	user: string | null;
	signin: (callback: VoidFunction) => void;
	signout: (callback: VoidFunction) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>(null!);

// Hook for components to get the auth context
const useAuth = () => {
	return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth available
const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<string | null>(null);

	// Sign in handler
	const signin = (callback: VoidFunction) => {
		return authService.signin((user) => {
			setUser(user);
			callback();
		});
	};

	// Sign out handler
	const signout = (callback: VoidFunction) => {
		return authService.signout(() => {
			setUser(null);
			callback();
		});
	};

	const value = { user, signin, signout };

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export { useAuth, AuthProvider };
