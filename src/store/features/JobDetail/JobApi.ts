import { createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";

export const getApplicationStageData = createAsyncThunk(
  "getApplicationStageData",
  async (data: undefined, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `${BASE_URL}/applicants/job-board/stages`,
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

export const saveJobCareerAI = createAsyncThunk(
  "saveJobCareerAI",
  async (data: { data: any }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        `${BASE_URL}/applicants/job-board/stages`,
        data
      );
      //   successToastMessage("Sign in successful.");
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
