import { useContext } from 'react';
import { AuthContext } from './authContext';

// Hook for components to get the auth context
const useAuth = () => {
	return useContext(AuthContext);
};

export { useAuth };
