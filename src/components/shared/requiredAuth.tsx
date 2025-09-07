import { Navigate, useLocation } from 'react-router-dom';
import { FC, ReactNode } from 'react';
import { useAuth } from '@/context/auth/useAuth';

type RequireAuthProps = {
	children: ReactNode;
};

/**
 * A wrapper component that redirects to the login page if the user isn't authenticated
 */
const RequireAuth: FC<RequireAuthProps> = ({ children }) => {
	const auth = useAuth();
	const location = useLocation();

	if (!auth.user) {
		// Redirect to the login page, but save the current location
		return <Navigate to='/login' state={{ from: location }} replace />;
	}

	// User is authenticated, render the protected route
	return <>{children}</>;
};

export { RequireAuth };
