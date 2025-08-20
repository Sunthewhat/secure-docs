import { User } from '@/types/context';
import { createContext } from 'react';

interface AuthContextType {
	user: User | null;
	signin: (userData: User, callback: VoidFunction) => void;
	signout: (callback: VoidFunction) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>(null!);

export { AuthContext };
