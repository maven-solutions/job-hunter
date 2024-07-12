import { createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL, VA_BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";
export const getApplicantsData = createAsyncThunk(
  "getApplicantsData",
  async (data: undefined, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `${VA_BASE_URL}/get-me-with-applicants`,
        data
      );
      return res.data;
    } catch (error: any) {
      //   errorToastMessage(error.response?.data?.message);
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  }
);

export const getApplicantResume = createAsyncThunk(
  "getApplicantResume",
  async (data: undefined, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `${BASE_URL}/applicants/resumes`,
        data
      );
      return res.data;
    } catch (error: any) {
      //   errorToastMessage(error.response?.data?.message);
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  }
);