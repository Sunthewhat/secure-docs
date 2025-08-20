import axios, { AxiosInstance } from "axios";

export const Axios: AxiosInstance = axios.create({
  baseURL: "https://easy-cert-api.sunthewhat.com/api/v1",
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status <= 500,
});