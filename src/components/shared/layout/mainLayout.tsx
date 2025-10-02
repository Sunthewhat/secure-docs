import { Outlet } from 'react-router-dom';
import { TopBar } from '../topBar';
import Background from '@/asset/Background_Image.jpg';
import { useState } from 'react';

/**
 * Layout component that includes navigation and auth status
 */
const Layout = () => {
	const [pageTopBarProps, setPageTopBarProps] = useState(null);

	return (
		<div className='relative min-h-screen w-full overflow-hidden font-noto'>
			<div className='absolute inset-0 bg-primary_background' />

			{/* Background image */}
			<img
				src={Background}
				alt=''
				className='fixed top-0 left-0 w-dvw h-dvh pointer-events-none'
			/>

			<div className='relative z-10 flex min-h-screen flex-col gap-20'>
				{/* Header */}
				<TopBar pageTopBarProps={pageTopBarProps} />
				{/* Main content */}
				<main className='flex-1 mx-auto w-full px-20 py-6 sm:px-6 lg:px-30'>
					<Outlet context={{ setPageTopBarProps }} />
				</main>
			</div>
		</div>
	);
};

export { Layout };
