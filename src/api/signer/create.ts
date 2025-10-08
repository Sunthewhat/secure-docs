import { Axios } from "@/util/axiosInstance";
import { AddSignerResponse } from "@/types/response";

const addSigner = async (name: string, email: string) => {
	const response = await Axios.post<AddSignerResponse>("/signer", {
		display_name: name,
		email,
	});

	return response.data;
};

export { addSigner };
