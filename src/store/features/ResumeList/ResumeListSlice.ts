import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getApplicantsData } from "./ResumeListApi";
const initialState: any = {
  loading: false,
  res_success: false,
  applicantData: [],
};

const ResumeList = createSlice({
  name: "ResumeList",
  initialState,
  reducers: {},
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
  },
});

export const {} = ResumeList.actions;

export default ResumeList.reducer;
