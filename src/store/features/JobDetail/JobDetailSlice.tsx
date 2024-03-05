import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: any = {
  loading: false,
  res_success: false,
  title: "",
  location: "",
  jobtype: "",
  company: "",
  postUrl: "",
  description: "",
  addationlIfo: [],
  jobFound: false,
  companyLogo: "",
  source: "",
};

const JobDetails = createSlice({
  name: "jobDetails",
  initialState,
  reducers: {
    setJobTitle: (state: any, { payload }: PayloadAction<any>) => {
      state.title = payload;
    },
    setJobCompany: (state: any, { payload }: PayloadAction<any>) => {
      state.company = payload;
    },
    setJobLocation: (state: any, { payload }: PayloadAction<any>) => {
      state.location = payload;
    },
    setJobPostUrl: (state: any, { payload }: PayloadAction<any>) => {
      state.postUrl = payload;
    },
    setJobSummary: (state: any, { payload }: PayloadAction<any>) => {
      let filteredArray = payload.filter((item) => item !== "");
      state.addationlIfo = filteredArray;
    },
    setJobDesc: (state: any, { payload }: PayloadAction<any>) => {
      state.description = payload;
    },
    setJobFoundStatus: (state: any, { payload }: PayloadAction<any>) => {
      state.jobFound = payload;
    },
    setJobCompanyLogo: (state: any, { payload }: PayloadAction<any>) => {
      state.companyLogo = payload;
    },
    setJobSource: (state: any, { payload }: PayloadAction<any>) => {
      state.source = payload;
    },
    setJobType: (state: any, { payload }: PayloadAction<any>) => {
      state.jobtype = payload;
    },
    clearJobState: (state: any) => {
      state.title = "";
      state.location = "";
      state.company = "";
      state.jobtype = "";
      state.postUrl = "";
      state.description = "";
      state.addationlIfo = [];
      state.jobFound = false;
      state.source = "";
      state.companyLogo = "";
    },
  },
});

export const {
  setJobTitle,
  setJobCompany,
  setJobType,
  setJobLocation,
  setJobPostUrl,
  setJobSummary,
  setJobDesc,
  setJobFoundStatus,
  setJobSource,
  clearJobState,
  setJobCompanyLogo,
} = JobDetails.actions;

export default JobDetails.reducer;
