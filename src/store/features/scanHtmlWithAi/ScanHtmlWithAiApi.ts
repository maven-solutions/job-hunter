import { createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";

export interface JobApplicationFillElement {
  label: string;
  required: boolean;
  type: "text" | "search" | string;
  options?: string[];
}

export interface JobApplicationFillPayload {
  elements: JobApplicationFillElement[];
  resumeId: string | number;
  userId: string | number;
  parser: string;
  source: string;
  url: string;
  token: string;
  fromAgent: boolean;
}

export const getJobApplicationFillWithAi = createAsyncThunk(
  "getJobApplicationFillWithAi",
  async (data: JobApplicationFillPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        `${BASE_URL}/job-application-fill`,
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
