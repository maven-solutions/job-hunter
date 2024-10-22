import axiosInstance from "../config/axiosInstance";
import { BASE_URL } from "../config/urlconfig";

export const saveAudofillJob = async (data) => {
  try {
    const res = await axiosInstance.post(`${BASE_URL}/autofill-jobs`, data);
    return res.data;
  } catch (error: any) {
    console.log("error", error);
    if (!error.response) {
      throw error;
    }
  }
};
