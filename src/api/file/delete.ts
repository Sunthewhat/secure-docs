import { Axios } from "@/util/axiosInstance";
import { DeleteResourceResponse } from "@/types/response";

const deleteBackground = async (url: string) => {
	const response = await Axios.delete<DeleteResourceResponse>(
		"/files/background",
		{
			data: { url },
		}
	);

	return response.data;
};

const deleteImage = async (url: string) => {
	const response = await Axios.delete<DeleteResourceResponse>(
		"/files/graphic",
		{
			data: { url },
		}
	);

	return response.data;
};

export { deleteBackground, deleteImage };
