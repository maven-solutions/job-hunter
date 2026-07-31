import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createJobApplicationFill } from "./ScanHtmlWithAiApi";

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
    builder.addCase(createJobApplicationFill.pending, (state) => {
      state.loading.create = true;
      state.req_success.create = false;
      state.error = null;
    });
    builder.addCase(
      createJobApplicationFill.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.loading.create = false;
        state.req_success.create = true;
        state.fillResult = payload?.data ?? payload;
        state.error = null;
      },
    );
    builder.addCase(
      createJobApplicationFill.rejected,
      (state, { payload }: PayloadAction<any>) => {
        state.loading.create = false;
        state.req_success.create = false;
        state.error = payload?.message ?? "Failed to fill job application";
      },
    );
  },
});

export const { clearJobApplicationFill } = ScanHtmlWithAiSlice.actions;

export default ScanHtmlWithAiSlice.reducer;
