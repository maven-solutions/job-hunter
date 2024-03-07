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
    setUser: (state: any, { payload }: PayloadAction<string>) => {
      console.log("user dispatched---", payload);

      state.ci_user = payload;
    },
    setToken: (state: any, { payload }: PayloadAction<string>) => {
      console.log("token dispatched---", payload);
      state.ci_token = payload;
      state.authenticated = payload ? true : false;
    },
    logoutUser: (state: any, { payload }: PayloadAction<string>) => {
      chrome.storage.local.set({ ci_user: "" });
      chrome.storage.local.set({ ci_token: "" });
      state.ci_token = null;
      state.ci_user = null;
      state.authenticated = false;
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

export const { setUser, setToken, logoutUser } = AuthSlice.actions;

export default AuthSlice.reducer;
