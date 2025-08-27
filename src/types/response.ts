export type Login = {
	token: string;
	username: string;
	firstname: string;
	lastname: string;
};

export type Participant = {
	id: string;
	certificate_id: string;
	is_revoked: boolean;
	created_at: string;
	updated_at: string;
	data: {
		[key: string]: string; // dynamic columns
	};
};
export type GetParticipantResponse = BaseResponse<Participant[]>;

export type CertType = {
	id: string;
	name: string;
	design: string;
};

export type Certificate = {
	id: string;
	name: string;
	design: string;
	user_id: string;
	created_at: string;
	updated_at: string;
};

export type BaseResponse<T> = {
	success: boolean;
	msg: string;
	data: T;
};

export type LoginResponse = BaseResponse<Login>;
export type AllCertTypeResponse = BaseResponse<CertType[]>;
export type AddParticipantResponse = BaseResponse<{ id: string }>;
export type DeleteCertResponse = BaseResponse<{ id: string }>;
export type GetCertificateResponse = BaseResponse<Certificate>;
