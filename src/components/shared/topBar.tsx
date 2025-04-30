import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import { Button } from '../ui/button';

const TopBar: FC = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	return (
		<header className='bg-white shadow'>
			<div className='max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center'>
				<h1 className='text-2xl font-bold text-gray-900'>My Auth App</h1>
				{/* Auth status */}
				<div>
					{auth.user ? (
						<div className='flex items-center gap-4'>
							<span>Logged in as {auth.user}</span>
							<button
								onClick={() => {
									auth.signout(() => void navigate('/'));
								}}
								className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'
							>
								Sign out
							</button>
						</div>
					) : (
						<Button onClick={() => void navigate('/login')}>log in</Button>
					)}
				</div>
			</div>
		</header>
	);
};

export { TopBar };
