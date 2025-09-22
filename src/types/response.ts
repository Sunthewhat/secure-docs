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
	is_distributed: boolean;
	created_at: string;
	updated_at: string;
	certificate_url: string;
	data: {
		[key: string]: string; // dynamic columns
	};
};

export type CertType = {
	id: string;
	name: string;
	design: string;
	thumbnail_url: string;
	archive_url: string;
	created_at?: string;
	updated_at?: string;
};

export type Certificate = {
	id: string;
	name: string;
	design: string;
	user_id: string;
	created_at: string;
	updated_at: string;
	archive_url: string;
	thumbnail_url: string;
};

type uploadFileType = {
	filename: string;
	object_name: string;
	size: number;
	url: string;
};

type getImage = {
	count: number;
	files: string[];
	type: string;
};
export type BaseResponse<T> = {
	success: boolean;
	msg: string;
	data: T;
};

export type ValidateParticipantData = {
	certificate: Certificate;
	participant: Participant;
};

// auth
export type LoginResponse = BaseResponse<Login>;

// certificate
export type AllCertTypeResponse = BaseResponse<CertType[]>;
export type DeleteCertResponse = BaseResponse<{ id: string }>;
export type GetCertificateResponse = BaseResponse<Certificate>;
export type DistributeCertResponse = BaseResponse<Participant[]>;
export type GetAnchorResponse = BaseResponse<string[]>;

//file
export type UploadResourceResponse = BaseResponse<uploadFileType>;
export type GetFilesResponse = BaseResponse<getImage>;

// participant
export type GetParticipantResponse = BaseResponse<Participant[]>;
export type AddParticipantResponse = BaseResponse<{ id: string }>;
export type EditParticipantResponse = BaseResponse<Participant>;
export type DeleteParticipantResponse = BaseResponse<{ id: string }>;

export type GetParticipantDataResponse = BaseResponse<ValidateParticipantData>;
