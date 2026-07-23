import { createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";

export const getApplicantSession = createAsyncThunk(
  "getApplicantSession",
  async (_data: undefined, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`${BASE_URL}/applicants/session`);
      return res.data;
    } catch (error: any) {
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export const uploadApplicantSessionScreenshot = createAsyncThunk(
  "uploadApplicantSessionScreenshot",
  async (screenshot: Blob, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("screenshot", screenshot, `screenshot-${Date.now()}.png`);

      const res = await axiosInstance.post(
        `${BASE_URL}/applicants/session/screenshot`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return res.data;
    } catch (error: any) {
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);
