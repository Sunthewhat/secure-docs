import { Axios } from "@/util/axiosInstance";
import { GetSignersResponse } from "@/types/response";

const getSigners = async () => {
	const response = await Axios.get<GetSignersResponse>("/signer");
	return response.data;
};

export { getSigners };
