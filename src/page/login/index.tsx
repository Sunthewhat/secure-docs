import { useNavigate, useLocation } from 'react-router-dom';
import { FormEvent } from 'react';
import { useAuth } from '@/context/authContext';

type LocationState = {
	from?: {
		pathname: string;
	};
};

// Login page (public)
const LoginPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const auth = useAuth();

	// Get the redirect path from location state or default to dashboard
	const from = (location.state as LocationState).from?.pathname || '/dashboard';

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const username = formData.get('username') as string;

		console.log(username);

		// Call the auth signin method
		auth.signin(() => {
			// Redirect to the page they tried to visit
			void navigate(from, { replace: true });
		});
	};

	return (
		<div className='p-4 max-w-md mx-auto'>
			<h2 className='text-2xl font-bold mb-4'>Login</h2>
			<p className='mb-4'>You must log in to view the dashboard.</p>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label htmlFor='username' className='block mb-1'>
						Username:
					</label>
					<input
						name='username'
						type='text'
						className='w-full border p-2 rounded'
						defaultValue='user@example.com'
					/>
				</div>
				<div>
					<label htmlFor='password' className='block mb-1'>
						Password:
					</label>
					<input
						name='password'
						type='password'
						className='w-full border p-2 rounded'
						defaultValue='password'
					/>
				</div>
				<button
					type='submit'
					className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
				>
					Login
				</button>
			</form>
		</div>
	);
};

export { LoginPage };
