import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getApplicationStageData, saveJobCareerAI } from "./JobApi";
const initialState: any = {
  loading: false,
  res_success: false,
  stage_data_success: false,
  stage_data_loading: false,
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
  selectedStage: "",
  stage_data: [],
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
    setSelectedStage: (state: any, { payload }: PayloadAction<any>) => {
      state.selectedStage = payload;
    },
    setButtonDisabledFalse: (state: any) => {
      state.res_success = false;
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
      state.selectedStage = "";
    },
  },
  extraReducers: (builder) => {
    // getStages
    builder.addCase(getApplicationStageData.pending, (state) => {
      state.stage_data_success = false;
      state.stage_data_loading = true;
    });
    builder.addCase(
      getApplicationStageData.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.stage_data_success = true;
        const filteredArray = payload.data.map((data) => {
          return { value: data.id, label: data.name };
        });
        state.stage_data = filteredArray;
        state.selectedStage = filteredArray?.length > 0 ? filteredArray[0] : "";
        state.stage_data_loading = false;
      }
    );
    builder.addCase(getApplicationStageData.rejected, (state) => {
      state.stage_data_success = true;
      state.stage_data_loading = false;
    });

    // ADD JOBS
    builder.addCase(saveJobCareerAI.pending, (state) => {
      state.loading = true;
      state.res_success = false;
    });
    builder.addCase(
      saveJobCareerAI.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.loading = false;
        state.res_success = true;
        // const filteredArray = payload.data.map((data) => {
        //   return { value: data.id, label: data.name };
        // });
        // state.stage_data = filteredArray;
        // console.log("stage_data::", state.stage_data);
      }
    );
    builder.addCase(saveJobCareerAI.rejected, (state) => {
      state.loading = false;
      state.res_success = false;
    });
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
  setSelectedStage,
  setButtonDisabledFalse,
} = JobDetails.actions;

export default JobDetails.reducer;
