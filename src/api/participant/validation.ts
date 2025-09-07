import { GetParticipantDataResponse } from '@/types/response';
import { Axios } from '@/util/axiosInstance';
import { AxiosError } from 'axios';

const getParticipantData = async (participantId: string) => {
	const response = await Axios.get<GetParticipantDataResponse>(
		`/participant/validation/${participantId}`
	).catch((e) => {
		if (e instanceof AxiosError) {
			return {
				success: false,
				msg: e.message,
				data: {} as GetParticipantDataResponse,
			};
		}
		return {
			success: false,
			msg: (e as Error).message,
			data: {} as GetParticipantDataResponse,
		};
	});
	return response.data;
};

export { getParticipantData };
