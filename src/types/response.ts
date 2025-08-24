export type Login = {
  token: string;
  username: string;
  firstname: string;
  lastname: string;
};

export type CertType = {
  id: string;
  name: string;
  design: string;
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
