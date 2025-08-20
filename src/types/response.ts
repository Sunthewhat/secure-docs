export type Login = {
	token: string;
	username: string;
	firstname: string;
	lastname: string;
};

export type BaseResponse<T> = {
	success: boolean;
	msg: string;
	data: T;
};

export type LoginResponse = BaseResponse<Login>;
