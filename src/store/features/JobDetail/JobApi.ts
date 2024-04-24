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
  async (post_data: any, { dispatch, rejectWithValue }) => {
    const { data, onSuccess } = post_data;
    try {
      const res = await axiosInstance.post(
        `${BASE_URL}/applicants/job-board/jobs`,
        data
      );
      console.log("success", res);
      //   successToastMessage("Sign in successful.");
      onSuccess && onSuccess();
      return res.data;
    } catch (error: any) {
      console.log("error", error);
      //   errorToastMessage(error.response?.data?.message);
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  }
);
