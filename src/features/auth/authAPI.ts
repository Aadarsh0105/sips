import api from "../../api/axios";
import { API } from "../../api/endpoints";

export const loginAPI = async (data: any) => {
  const res = await api.post(API.LOGIN, data);

  return res.data;
};
