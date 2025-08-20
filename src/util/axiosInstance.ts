import axios, { AxiosInstance } from 'axios';

const Axios: AxiosInstance = axios.create({
	baseURL: 'https://easy-cert-api.sunthewhat.com/api/v1',
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

export { Axios };
