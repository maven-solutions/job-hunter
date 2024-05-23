import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
      state.ci_user = payload;
    },
    setToken: (state: any, { payload }: PayloadAction<string>) => {
      state.ci_token = payload;
      state.authenticated = payload ? true : false;
    },
    logoutUser: (state: any, { payload }: PayloadAction<string>) => {
      chrome.storage.local.clear();
      // chrome.storage.local.set({ ci_token: "" });
      state.ci_token = null;
      state.ci_user = null;
      state.authenticated = false;
    },
  },
  extraReducers: (builder) => {},
});

export const { setUser, setToken, logoutUser } = AuthSlice.actions;

export default AuthSlice.reducer;
