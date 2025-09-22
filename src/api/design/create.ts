import { Axios } from '@/util/axiosInstance';

export const createDesign = async () => {
	const response = await Axios.post('/certificate', {
		name: 'Untitled Certificate',
		design: JSON.stringify({
			version: '5.3.0',
			objects: []
		})
	});

	return response;
};