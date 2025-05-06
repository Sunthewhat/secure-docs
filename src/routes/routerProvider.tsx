import { Layout } from '@/components/shared/layout/mainLayout';
import { RequireAuth } from '@/components/shared/requiredAuth';
import { DashboardPage } from '@/page/design';
import { HomePage } from '@/page/home';
import { LoginPage } from '@/page/login';
import { FC } from 'react';
import { Routes, Route } from 'react-router';

const RouterProvider: FC = () => {
	return (
		<Routes>
			<Route element={<Layout />}>
				{/* Public Routes */}
				<Route path='/' element={<HomePage />} />
				<Route path='/login' element={<LoginPage />} />

				{/* Protected Routes */}
				<Route
					path='/dashboard'
					element={
						<RequireAuth>
							<DashboardPage />
						</RequireAuth>
					}
				/>

				{/* Fallback for undefined routes */}
				<Route path='*' element={<p>There's nothing here!</p>} />
			</Route>
		</Routes>
	);
};

export { RouterProvider };
