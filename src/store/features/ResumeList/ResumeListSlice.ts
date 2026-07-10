import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getApplicantsData,
  getApplicantResume,
  getDesignations,
  getIndividualSession,
  startIndividualSession,
  cancelIndividualSession,
  uploadIndividualSessionScreenshot,
} from "./ResumeListApi";
const initialState: any = {
  loading: false,
  deg_loading: false,
  res_success: false,
  deg_res_success: false,
  individualSession_loading: false,
  individualSession_res_success: false,
  startIndividualSession_loading: false,
  cancelIndividualSession_loading: false,
  screenshotUploading: false,
  screenshotUploadError: null,

  applicantData: [],
  userList: [],
  individualApplicantData: [],
  individualUserList: [],
  allRoles: [],
  userIndex: 0,
  resumeIndex: 0,
  individualSession: null,
};

const ResumeList = createSlice({
  name: "ResumeList",
  initialState,
  reducers: {
    setResumeResponseToFalse: (state: any) => {
      state.res_success = false;
    },
    setUserIndex: (state: any, { payload }: PayloadAction<any>) => {
      state.userIndex = payload;
    },
    setResumeIndex: (state: any, { payload }: PayloadAction<any>) => {
      state.resumeIndex = payload;
    },
  },
  extraReducers: (builder) => {
    // getStages
    builder.addCase(getApplicantsData.pending, (state) => {
      state.loading = true;
      state.res_success = false;
    });
    builder.addCase(
      getApplicantsData.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.loading = false;
        state.res_success = true;
        state.applicantData = payload.data.applicants ?? [];
        state.individualApplicantData = payload.data.individualApplicants ?? [];
        state.userList = (payload.data.applicants ?? []).map((data) => ({
          label: data.fullName,
          value: data.applicantId,
        }));
        state.individualUserList = (
          payload.data.individualApplicants ?? []
        ).map((data) => ({ label: data.fullName, value: data.applicantId }));
      },
    );
    builder.addCase(getApplicantsData.rejected, (state) => {
      state.loading = false;
      state.res_success = false;
    });

    // GET ALL APPLICANT RESUME
    builder.addCase(getApplicantResume.pending, (state) => {
      state.loading = true;
      state.res_success = false;
    });
    builder.addCase(
      getApplicantResume.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.loading = false;
        state.res_success = true;
        const filteredData =
          payload.data.filter((data: any) => data.pdfUrl) ?? [];
        state.applicantData = filteredData;
      },
    );
    builder.addCase(getApplicantResume.rejected, (state) => {
      state.loading = false;
      state.res_success = false;
    });

    // GET ALL DESIGINATION
    builder.addCase(getDesignations.pending, (state) => {
      state.deg_loading = true;
      state.deg_res_success = false;
    });
    builder.addCase(
      getDesignations.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.deg_loading = false;
        state.deg_res_success = true;
        state.allRoles = payload?.data;
      },
    );
    builder.addCase(getDesignations.rejected, (state) => {
      state.deg_loading = false;
      state.deg_res_success = false;
    });

    // GET INDIVIDUAL SESSION
    builder.addCase(getIndividualSession.pending, (state) => {
      state.individualSession_loading = true;
      state.individualSession_res_success = false;
    });
    builder.addCase(
      getIndividualSession.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.individualSession_loading = false;
        state.individualSession_res_success = true;
        state.individualSession = payload?.data;
      },
    );
    builder.addCase(getIndividualSession.rejected, (state) => {
      state.individualSession_loading = false;
      state.individualSession_res_success = false;
    });

    // START INDIVIDUAL SESSION
    builder.addCase(startIndividualSession.pending, (state) => {
      state.startIndividualSession_loading = true;
    });
    builder.addCase(
      startIndividualSession.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.startIndividualSession_loading = false;
        state.individualSession_res_success = true;
        state.individualSession = payload?.data ?? null;
      },
    );
    builder.addCase(startIndividualSession.rejected, (state) => {
      state.startIndividualSession_loading = false;
    });

    // CANCEL INDIVIDUAL SESSION
    builder.addCase(cancelIndividualSession.pending, (state) => {
      state.cancelIndividualSession_loading = true;
    });
    builder.addCase(cancelIndividualSession.fulfilled, (state) => {
      state.cancelIndividualSession_loading = false;
      state.individualSession_res_success = false;
      state.individualSession = null;
    });
    builder.addCase(cancelIndividualSession.rejected, (state) => {
      state.cancelIndividualSession_loading = false;
    });

    builder.addCase(uploadIndividualSessionScreenshot.pending, (state) => {
      state.screenshotUploading = true;
      state.screenshotUploadError = null;
    });
    builder.addCase(
      uploadIndividualSessionScreenshot.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.screenshotUploading = false;
        state.screenshotUploadError = null;
        if (payload?.data) {
          state.individualSession = {
            ...state.individualSession,
            ...payload.data,
          };
        }
      },
    );
    builder.addCase(
      uploadIndividualSessionScreenshot.rejected,
      (state, { payload }: PayloadAction<any>) => {
        state.screenshotUploading = false;
        state.screenshotUploadError =
          payload?.message ?? "Failed to upload screenshot";
      },
    );
  },
});

export const { setResumeResponseToFalse, setUserIndex, setResumeIndex } =
  ResumeList.actions;

export default ResumeList.reducer;
