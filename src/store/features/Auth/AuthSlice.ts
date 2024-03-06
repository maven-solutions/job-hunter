import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { userSignIn } from "./AuthApi";

const initialState: any = {
  loading: {
    login: false,
    logout: false,
  },
  req_success: {
    login: false,
    logout: false,
  },
  authenticated: false,
  ci_token: null,
  ci_user: null,
  isVerified: false,
};

const AuthSlice = createSlice({
  name: "userSignUp",
  initialState,
  reducers: {
    setRecentSignupEmail: (state: any, { payload }: PayloadAction<string>) => {
      state.recent_signup_email = payload;
    },
    setUser: (state: any, { payload }: PayloadAction<string>) => {
      state.ci_user = payload;
    },
    setToken: (state: any, { payload }: PayloadAction<string>) => {
      state.token = payload;
      state.authenticated = payload ? true : false;
    },
  },
  extraReducers: (builder) => {
    // SIGNIN
    builder.addCase(userSignIn.pending, (state) => {
      state.loading.login = true;
      state.req_success.login = false;
    });
    builder.addCase(
      userSignIn.fulfilled,
      (state, { payload }: PayloadAction<any>) => {
        state.loading.login = false;
        state.req_success.login = true;
        state.ci_user = payload.user;
        state.ci_token = payload.token;
        state.authenticated = true;
        chrome.storage.local.set({ ci_user: JSON.stringify(state.ci_user) });
        chrome.storage.local.set({ ci_token: JSON.stringify(state.ci_token) });
      }
    );
    builder.addCase(userSignIn.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const { setRecentSignupEmail, setUser, setToken } = AuthSlice.actions;

export default AuthSlice.reducer;
