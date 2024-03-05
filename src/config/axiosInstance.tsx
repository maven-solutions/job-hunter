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

async function getToken() {
  return new Promise<string | null>((resolve) => {
    const token = localStorage.getItem("access_token");
    resolve(token);
  });
}

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        // clearBrowserStorage.removeUserRef();
        window.location.href = "/";
      }
      throw error;
    } else {
      Promise.reject(error);
    }
  }
);

export default axiosInstance;
