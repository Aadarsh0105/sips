import api from "../../api/axios";
import { API } from "../../api/endpoints";

export const loginAPI = async (data: any) => {
  const res = await api.post(API.LOGIN, data);

  return res.data;
};

export const verifyLoginOtpAPI = async (data: { requestId: string; otp: string }) => {
  const res = await api.post(API.LOGIN_VERIFY_OTP, data);
  return res.data;
};

export const resendLoginOtpAPI = async (data: { requestId: string }) => {
  const res = await api.post(API.LOGIN_RESEND_OTP, data);
  return res.data;
};
