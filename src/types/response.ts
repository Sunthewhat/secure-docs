export type Login = {
	token: string;
	username: string;
	firstname: string;
	lastname: string;
};

export type CertType ={
	name: string;
	design: string;
}

export type BaseResponse<T> = {
	success: boolean;
	msg: string;
	data: T;
};

export type LoginResponse = BaseResponse<Login>;
export type AllCertTypeResponse = BaseResponse<CertType[]>;
