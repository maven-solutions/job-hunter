import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getApplicantsData, getApplicantResume } from "./ResumeListApi";
const initialState: any = {
  loading: false,
  res_success: false,
  applicantData: [],
};

const ResumeList = createSlice({
  name: "ResumeList",
  initialState,
  reducers: {
    setResumeResponseToFalse: (state: any) => {
      state.res_success = false;
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
        state.applicantData = payload.data;
      }
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
      }
    );
    builder.addCase(getApplicantResume.rejected, (state) => {
      state.loading = false;
      state.res_success = false;
    });
  },
});

export const { setResumeResponseToFalse } = ResumeList.actions;

export default ResumeList.reducer;