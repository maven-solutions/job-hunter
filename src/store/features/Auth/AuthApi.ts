import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../../config/urlconfig";

export const userSignIn = createAsyncThunk(
  "userSignIn",
  async (data: { data: any }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, data);
      //   successToastMessage("Sign in successful.");
      console.log("res---", res);
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
