import { Axios } from "@/util/axiosInstance";
import { GetFilesResponse } from "@/types/response";

const getBackgrounds = async () => {
	const response = await Axios.get<GetFilesResponse>("/files/background");
	return response.data;
};

const getGraphics = async () => {
	const response = await Axios.get<GetFilesResponse>("/files/graphic");
	return response.data;
};

export { getBackgrounds, getGraphics };
