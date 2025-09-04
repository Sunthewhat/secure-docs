import axios, { AxiosInstance } from 'axios';
import { NavigateFunction } from 'react-router';

const Axios: AxiosInstance = axios.create({
	baseURL: `${import.meta.env.VITE_BACKEND_API}/api/v1`,
	withCredentials: true,
	validateStatus: (status) => status >= 200 && status <= 500,
	headers: {
		'Content-Type': 'application/json; charset=utf-8',
	},
});

Axios.interceptors.request.use(
	(config) => {
		if (config.url?.includes('/auth/login')) {
			return config;
		}

		const token = localStorage.getItem('authToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

Axios.interceptors.response.use(
	(response) => {
		const token = response.headers['x-refresh-token'];
		if (token) {
			localStorage.setItem('authToken', token);
		}
		return response;
	},
	(error) => Promise.reject(error)
);

let refreshInterval: NodeJS.Timeout | null = null;

const startTokenRefresh = (nav: NavigateFunction) => {
	if (refreshInterval) return; // Already running

	refreshInterval = setInterval(async () => {
		const token = localStorage.getItem('authToken');
		if (!token) {
			stopTokenRefresh();
			return;
		}

		try {
			const response = await Axios.get('/auth/verify');
			if (response.status != 200) {
				throw new Error('Invalid token');
			}
		} catch (error) {
			console.error('Token refresh failed:', error);
			stopTokenRefresh();
			nav('/login');
		}
	}, 60000); // 1 minute
};

const stopTokenRefresh = () => {
	if (refreshInterval) {
		clearInterval(refreshInterval);
		refreshInterval = null;
	}
};

export { Axios, startTokenRefresh, stopTokenRefresh };
