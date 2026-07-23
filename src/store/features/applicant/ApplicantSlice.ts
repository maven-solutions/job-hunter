import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getApplicantSession,
  uploadApplicantSessionScreenshot,
} from "./ApplicantApi";

const initialState: any = {
  session_loading: false,
  session_res_success: false,
  screenshotUploading: false,
  screenshotUploadError: null,

  applicantSession: null,
};

const ApplicantSlice = createSlice({
  name: "ApplicantSlice",
  initialState,
  reducers: {
    setApplicantSessionResponseToFalse: (state: any) => {
      state.session_res_success = false;
    },
  },
  extraReducers: (builder) => {
    // GET APPLICANT SESSION
    builder.addCase(getApplicantSession.pending, (state) => {
      state.session_loading = true;
      state.session_res_success = false;
    });
    builder.addCase(
      getApplicantSession.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.session_loading = false;
        state.session_res_success = true;
        state.applicantSession = payload?.data;
      },
    );
    builder.addCase(getApplicantSession.rejected, (state) => {
      state.session_loading = false;
      state.session_res_success = false;
    });

    // UPLOAD APPLICANT SESSION SCREENSHOT
    builder.addCase(uploadApplicantSessionScreenshot.pending, (state) => {
      state.screenshotUploading = true;
      state.screenshotUploadError = null;
    });
    builder.addCase(
      uploadApplicantSessionScreenshot.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.screenshotUploading = false;
        state.screenshotUploadError = null;
        if (payload?.data) {
          state.applicantSession = {
            ...state.applicantSession,
            ...payload.data,
          };
        }
      },
    );
    builder.addCase(
      uploadApplicantSessionScreenshot.rejected,
      (state, { payload }: PayloadAction<any>) => {
        state.screenshotUploading = false;
        state.screenshotUploadError =
          payload?.message ?? "Failed to upload screenshot";
      },
    );
  },
});

export const { setApplicantSessionResponseToFalse } = ApplicantSlice.actions;

export default ApplicantSlice.reducer;
