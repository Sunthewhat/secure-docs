import { User } from '@/types/context';
import { createContext, useContext } from 'react';

interface AuthContextType {
	user: User | null;
	signin: (userData: User, callback: VoidFunction) => void;
	signout: (callback: VoidFunction) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>(null!);

// Hook for components to get the auth context
const useAuth = () => {
	return useContext(AuthContext);
};

export { useAuth, AuthContext };
