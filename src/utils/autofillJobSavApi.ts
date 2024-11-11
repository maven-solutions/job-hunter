import axiosInstance from "../config/axiosInstance";
import { BASE_URL } from "../config/urlconfig";

export const saveAudofillJob = async (data) => {
  const res = await axiosInstance.post(`${BASE_URL}/autofill-jobs-o`, data);
  return res.data;
};
