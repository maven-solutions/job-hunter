import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getOrgSession,
  saveOrgSession,
  cancelOrgSession,
  uploadOrgSessionScreenshot,
  uploadOrgProofOfWork,
  deleteOrgProofOfWork,
} from "./OrgApi";

const initialState: any = {
  session_loading: false,
  session_res_success: false,
  saveSession_loading: false,
  cancelSession_loading: false,
  screenshotUploading: false,
  screenshotUploadError: null,
  proofOfWorkUploading: false,
  proofOfWorkUploadError: null,
  deletingScreenshotId: null,
  screenshotDeleteError: null,

  orgSession: null,
  proofOfWork: [],
};

const OrgSlice = createSlice({
  name: "OrgSlice",
  initialState,
  reducers: {
    setOrgSessionResponseToFalse: (state: any) => {
      state.session_res_success = false;
    },
  },
  extraReducers: (builder) => {
    // GET ORG SESSION
    builder.addCase(getOrgSession.pending, (state) => {
      state.session_loading = true;
      state.session_res_success = false;
    });
    builder.addCase(
      getOrgSession.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.session_loading = false;
        state.session_res_success = true;
        state.orgSession = payload?.data;
      },
    );
    builder.addCase(getOrgSession.rejected, (state) => {
      state.session_loading = false;
      state.session_res_success = false;
    });

    // SAVE ORG SESSION
    builder.addCase(saveOrgSession.pending, (state) => {
      state.saveSession_loading = true;
    });
    builder.addCase(
      saveOrgSession.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.saveSession_loading = false;
        state.session_res_success = true;
        state.orgSession = payload?.data ?? null;
      },
    );
    builder.addCase(saveOrgSession.rejected, (state) => {
      state.saveSession_loading = false;
    });

    // CANCEL ORG SESSION
    builder.addCase(cancelOrgSession.pending, (state) => {
      state.cancelSession_loading = true;
    });
    builder.addCase(cancelOrgSession.fulfilled, (state) => {
      state.cancelSession_loading = false;
      state.session_res_success = false;
      state.orgSession = null;
    });
    builder.addCase(cancelOrgSession.rejected, (state) => {
      state.cancelSession_loading = false;
    });

    // UPLOAD ORG SESSION SCREENSHOT
    builder.addCase(uploadOrgSessionScreenshot.pending, (state) => {
      state.screenshotUploading = true;
      state.screenshotUploadError = null;
    });
    builder.addCase(
      uploadOrgSessionScreenshot.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.screenshotUploading = false;
        state.screenshotUploadError = null;
        if (payload?.data) {
          state.orgSession = {
            ...state.orgSession,
            ...payload.data,
          };
        }
      },
    );
    builder.addCase(
      uploadOrgSessionScreenshot.rejected,
      (state, { payload }: PayloadAction<any>) => {
        state.screenshotUploading = false;
        state.screenshotUploadError =
          payload?.message ?? "Failed to upload screenshot";
      },
    );

    // UPLOAD ORG PROOF OF WORK
    builder.addCase(uploadOrgProofOfWork.pending, (state) => {
      state.proofOfWorkUploading = true;
      state.proofOfWorkUploadError = null;
    });
    builder.addCase(
      uploadOrgProofOfWork.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.proofOfWorkUploading = false;
        state.proofOfWorkUploadError = null;
        if (payload?.data?.proofOfWork) {
          state.proofOfWork = payload.data.proofOfWork;
        }
      },
    );
    builder.addCase(
      uploadOrgProofOfWork.rejected,
      (state, { payload }: PayloadAction<any>) => {
        state.proofOfWorkUploading = false;
        state.proofOfWorkUploadError =
          payload?.message ?? "Failed to upload proof of work";
      },
    );

    // DELETE ORG PROOF OF WORK
    builder.addCase(deleteOrgProofOfWork.pending, (state, { meta }) => {
      state.deletingScreenshotId = meta.arg.screenshotId;
      state.screenshotDeleteError = null;
    });
    builder.addCase(
      deleteOrgProofOfWork.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.deletingScreenshotId = null;
        state.screenshotDeleteError = null;

        if (payload?.data?.proofOfWork) {
          state.proofOfWork = payload.data.proofOfWork;
        }
      },
    );
    builder.addCase(
      deleteOrgProofOfWork.rejected,
      (state, { payload }: PayloadAction<any>) => {
        state.deletingScreenshotId = null;
        state.screenshotDeleteError =
          payload?.message ?? "Failed to delete screenshot";
      },
    );
  },
});

export const { setOrgSessionResponseToFalse } = OrgSlice.actions;

export default OrgSlice.reducer;
