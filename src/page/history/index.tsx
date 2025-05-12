import { useAuth } from '@/context/authContext';

const HistoryPage = () => {
	const auth = useAuth();

	return (
		<div className='p-4'>
			<h2 className='text-2xl font-bold mb-4'>Dashboard</h2>
			<p className='mb-4'>
				This is a protected page. You can only see this if you're logged in.
			</p>
			<p className='mb-4'>Welcome, {auth.user}!</p>
		</div>
	);
};

export { HistoryPage };
