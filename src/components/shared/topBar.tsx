import { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import { Button } from '../ui/button';
import { IoDocumentTextOutline } from "react-icons/io5";
import clsx from 'clsx';// Make sure this is imported

const TopBar: FC = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const isActive = (path: string) => location.pathname === path;

	return (
		<header className='bg-black shadow'>
			<div className='mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				
				{/* Left: Logo + nav */}
				<div className='flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto'>
					<IoDocumentTextOutline size={30} className="text-white" />
					<h1
					
						className='text-2xl font-bold text-white font-adlam cursor-pointer text-[25px]'
						onClick={() => {void navigate('/'); }}
					>
						SecureDocs
					</h1>

					{/* Nav Links */}
					<div className='flex flex-col sm:flex-row px-18 gap-2 sm:gap-15'>
						{[
							{ path: '/home', label: 'Home' },
							{ path: '/design', label: 'Design' },
							{ path: '/share', label: 'Share' },
							{ path: '/shared', label: 'Shared' },
						].map(({ path, label }) => (
							<Button
								key={path}
								variant="link"
								className={clsx(
									'hover:underline p-0 h-auto font-noto font-semibold text-[18px]',
									isActive(path) ? 'text-white' : 'text-gray-400'
								)}
								onClick={() => void navigate(path)}
							>
								{label}
							</Button>
						))}
					</div>
				</div>

				{/* Right: Auth status */}
				<div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
					{auth.user ? (
						<>
							<span className='text-white'>Logged in as {auth.user}</span>
							<button
								onClick={() => {
									auth.signout(() => {
										void navigate('/');
									});
								}}
								className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'
							>
								Sign out
							</button>
						</>
					) : (
						<Button onClick={() => { void navigate('/login'); }}>Log in</Button>
					)}
				</div>
			</div>
		</header>
	);
};

export { TopBar };
