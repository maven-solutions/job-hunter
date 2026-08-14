import { createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";

export interface JobApplicationFillNestedField {
  type: string;
  label: string;
  description?: string;
  options?: string[] | JobApplicationFillNestedField[];
  required?: boolean;
}

export interface JobApplicationFillElement {
  label: string;
  required: boolean;
  type: string;
  /** Select options or nested employment/education field schemas. */
  options?: string[] | JobApplicationFillNestedField[];
  description?: string;
  /** How many repeatable entries (Workday employment/education). */
  count?: number;
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
