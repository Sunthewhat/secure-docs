import { FC, useState, useRef, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth/useAuth';
import UserIcon from '@/asset/User.svg';
import EasyCertIcon from '@/asset/EasyCertLogo.svg';

interface PageTopBarProps {
	content?: ReactNode;
}

const TopBar: FC<{ pageTopBarProps?: PageTopBarProps | null }> = ({ pageTopBarProps }) => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div className='px-30 h-20 flex flex-row justify-between items-center'>
			{/* Left: Logo + nav */}
			<button className='flex justify-center items-center' onClick={() => void navigate('/')}>
				<img src={EasyCertIcon} alt='Logo' className='h-15' />
			</button>
			<div className='w-full flex justify-end pr-40'>
				{/* Middle: Page-specific content */}
				{pageTopBarProps?.content}
				<div />
			</div>

			{/* Right: User dropdown */}
			<div className='relative flex justify-center z-50' ref={dropdownRef}>
				<button
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					className='hover:opacity-80 transition-opacity'
				>
					<img src={UserIcon} className='h-10 w-10' alt='User' />
				</button>

				{isDropdownOpen && (
					<div className='absolute right-0 mt-16 w-48 bg-white rounded-lg shadow-lg py-2'>
						{auth.user ? (
							<>
								<div className='px-4 py-2 border-b border-gray-200'>
									<p className='text-sm font-semibold text-gray-800'>
										{auth.user.username}
									</p>
								</div>
								<button
									onClick={() => {
										auth.signout(() => {
											void navigate('/');
										});
										setIsDropdownOpen(false);
									}}
									className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors'
								>
									Logout
								</button>
							</>
						) : (
							<button
								onClick={() => {
									void navigate('/login');
									setIsDropdownOpen(false);
								}}
								className='w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors'
							>
								Log in
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export { TopBar };
