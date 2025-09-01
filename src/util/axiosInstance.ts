import axios, { AxiosInstance } from 'axios';

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
		localStorage.setItem('authToken', token);
		return response;
	},
	(error) => Promise.reject(error)
);

export { Axios };
