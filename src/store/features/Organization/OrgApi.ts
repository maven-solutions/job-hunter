import { createAsyncThunk } from "@reduxjs/toolkit";
import { VA_BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";

export const getOrgSession = createAsyncThunk(
  "getOrgSession",
  async (_data: undefined, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`${VA_BASE_URL}/session`);
      return res.data;
    } catch (error: any) {
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export interface SaveOrgSessionPayload {
  userId: string | number;
  jobId: string | number;
}

export const saveOrgSession = createAsyncThunk(
  "saveOrgSession",
  async (data: SaveOrgSessionPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`${VA_BASE_URL}/session`, data);
      return res.data;
    } catch (error: any) {
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export const cancelOrgSession = createAsyncThunk(
  "cancelOrgSession",
  async (_data: undefined, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`${VA_BASE_URL}/session`);
      return res.data;
    } catch (error: any) {
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export const uploadOrgSessionScreenshot = createAsyncThunk(
  "uploadOrgSessionScreenshot",
  async (screenshot: Blob, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("screenshot", screenshot, `screenshot-${Date.now()}.png`);

      const res = await axiosInstance.post(
        `${VA_BASE_URL}/session/screenshot`,
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

export interface UploadOrgProofOfWorkPayload {
  applicationTrackingId: string;
  userId: string | number;
  screenshots: Blob[];
}

export const uploadOrgProofOfWork = createAsyncThunk(
  "uploadOrgProofOfWork",
  async (data: UploadOrgProofOfWorkPayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("applicationTrackingId", data.applicationTrackingId);
      formData.append("userId", String(data.userId));
      data.screenshots.forEach((screenshot, index) => {
        formData.append(
          "screenshots",
          screenshot,
          `screenshot-${Date.now()}-${index}.png`,
        );
      });

      const res = await axiosInstance.post(
        `${VA_BASE_URL}/proof-of-work`,
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

export interface DeleteOrgProofOfWorkPayload {
  applicationTrackingId: string;
  userId: string | number;
  screenshotId: string;
}

export const deleteOrgProofOfWork = createAsyncThunk(
  "deleteOrgProofOfWork",
  async (data: DeleteOrgProofOfWorkPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`${VA_BASE_URL}/proof-of-work`, {
        data,
      });
      return res.data;
    } catch (error: any) {
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);
