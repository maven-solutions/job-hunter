import axios from "axios";
// import { clearBrowserStorage } from "../helpers/utils/clearStorage";

const axiosInstance = axios.create({
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // timeout: 60000,
});

axiosInstance.interceptors.request.use(
  async (config: any) => {
    const token = await getToken();

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);
export const getToken = async () => {
  // console.log("fired::");
  const result = await chrome.storage.local.get(["ci_token"]);
  // console.log("res::", result);
  const token = result.ci_token;
  return token;
};

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        chrome.storage.local.clear();
        // window.location.href = "/";
      }
      throw error;
    } else {
      Promise.reject(error);
    }
  }
);

export default axiosInstance;
