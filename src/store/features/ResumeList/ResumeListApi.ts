import { createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL, VA_BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";

export const getDesignations = createAsyncThunk(
  "getDesignationsData",
  async (data: undefined, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`${BASE_URL}/designations`);
      return res.data;
    } catch (error: any) {
      //   errorToastMessage(error.response?.data?.message);
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export const getApplicantsData = createAsyncThunk(
  "getApplicantsData",
  async (data: undefined, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `${VA_BASE_URL}/get-me-with-applicants`,
      );
      return res.data;
    } catch (error: any) {
      //   errorToastMessage(error.response?.data?.message);
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export const getApplicantResume = createAsyncThunk(
  "getApplicantResume",
  async (tenantId: any, { dispatch, rejectWithValue }) => {
    if (tenantId) {
      axiosInstance.defaults.headers["x-tenant-id"] = Number(tenantId);
    }

    try {
      const res = await axiosInstance.get(`${BASE_URL}/applicants/resumes`);
      return res.data;
    } catch (error: any) {
      //   errorToastMessage(error.response?.data?.message);
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export const getIndividualSession = createAsyncThunk(
  "getIndividualSession",
  async (data: undefined, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `${BASE_URL}/va/individual/session`,
      );
      return res.data;
    } catch (error: any) {
      //   errorToastMessage(error.response?.data?.message);
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  },
);

export interface SaveIndividualSessionPayload {
  userId: string | number;
  extensionJobId: string | number;
}

export const saveIndividualSession = createAsyncThunk(
  "saveIndividualSession",
  async (data: SaveIndividualSessionPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        `${BASE_URL}/va/individual/session`,
        data,
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

export const cancelIndividualSession = createAsyncThunk(
  "cancelIndividualSession",
  async (_data: undefined, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `${BASE_URL}/va/individual/session`,
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

export const uploadIndividualSessionScreenshot = createAsyncThunk(
  "uploadIndividualSessionScreenshot",
  async (screenshot: Blob, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append(
        "screenshot",
        screenshot,
        `screenshot-${Date.now()}.png`,
      );

      const res = await axiosInstance.post(
        `${BASE_URL}/va/individual/session/screenshot`,
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

export const deleteIndividualSessionScreenshot = createAsyncThunk(
  "deleteIndividualSessionScreenshot",
  async (screenshotId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `${BASE_URL}/va/individual/session/screenshot/${screenshotId}`,
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
