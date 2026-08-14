import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getJobApplicationFillWithAi } from "./ScanHtmlWithAiApi";

const initialState: any = {
  loading: {
    get: false,
    create: false,
  },
  req_success: {
    get: false,
    create: false,
  },
  fillResult: null,
  error: null,
};

const ScanHtmlWithAiSlice = createSlice({
  name: "ScanHtmlWithAiSlice",
  initialState,
  reducers: {
    clearJobApplicationFill: (state: any) => {
      state.fillResult = null;
      state.error = null;
      state.req_success.create = false;
    },
  },
  extraReducers: (builder) => {
    // CREATE JOB APPLICATION FILL
    builder.addCase(getJobApplicationFillWithAi.pending, (state) => {
      state.loading.get = true;
      state.req_success.get = false;
      state.error = null;
    });
    builder.addCase(
      getJobApplicationFillWithAi.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.loading.get = false;
        state.req_success.get = true;
        state.fillResult = payload?.data ?? payload;
        state.error = null;
      },
    );
    builder.addCase(
      getJobApplicationFillWithAi.rejected,
      (state, { payload }: PayloadAction<any>) => {
        state.loading.get = false;
        state.req_success.get = false;
        state.error = payload?.message ?? "Failed to fill job application";
      },
    );
  },
});

export const { clearJobApplicationFill } = ScanHtmlWithAiSlice.actions;

export default ScanHtmlWithAiSlice.reducer;
