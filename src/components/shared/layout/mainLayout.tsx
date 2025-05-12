import { Outlet } from 'react-router-dom';
import { TopBar } from '../topBar';

/**
 * Layout component that includes navigation and auth status
 */
const Layout = () => {
	return (
		<div className='min-h-screen bg-gray-200'>
			{/* Header */}
			<TopBar />
			{/* Main content */}
			<main className='max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8'>
				<Outlet />
			</main>
		</div>
	);
};

export { Layout };
