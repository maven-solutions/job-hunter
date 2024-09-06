import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getApplicantsData,
  getApplicantResume,
  getDesignations,
} from "./ResumeListApi";
const initialState: any = {
  loading: false,
  deg_loading: false,
  res_success: false,
  deg_res_success: false,

  applicantData: [],
  userList: [],
  allRoles: [],
  userIndex: 0,
  resumeIndex: 0,
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
        state.applicantData = payload.data;
        const userList = payload?.data?.map((data) => {
          return { label: data.fullName, value: data.applicantId };
        });
        state.userList = userList;
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
      }
    );
    builder.addCase(getDesignations.rejected, (state) => {
      state.deg_loading = false;
      state.deg_res_success = false;
    });
  },
});

export const { setResumeResponseToFalse, setUserIndex, setResumeIndex } =
  ResumeList.actions;

export default ResumeList.reducer;
