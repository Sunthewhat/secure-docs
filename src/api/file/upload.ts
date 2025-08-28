import { UploadResourceResponse } from "@/types/response";
import { Axios } from "@/util/axiosInstance";

const uploadBackground = async (file: File) => {
	const formData = new FormData();

	formData.append("image", file);

	const response = await Axios.post<UploadResourceResponse>(
		"/files/background",
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
			},
		}
	);

	return response.data;
};

const uploadImage = async (file: File) => {
	const formData = new FormData();

	formData.append("image", file);

	const response = await Axios.post<UploadResourceResponse>(
		"/files/graphic",
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
			},
		}
	);

	return response.data;
};

export { uploadBackground, uploadImage };
