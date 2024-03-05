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
        console.log("payload---", payload);
        state.ci_user = payload.user;
        state.ci_token = payload.token;
        chrome.storage.local
          .set({ ci_user: JSON.stringify(state.ci_user) })
          .then(() => {
            console.log("user is set");
            chrome.storage.local.get(["ci_user"]).then((result) => {
              console.log("ci_user is ", JSON.parse(result.ci_user));
            });
          });
        chrome.storage.local
          .set({ ci_token: JSON.stringify(state.ci_token) })
          .then(() => {
            console.log("token is set");

            chrome.storage.local.get(["ci_token"]).then((result) => {
              console.log("ci_token is ", JSON.parse(result.ci_token));
            });
          });
        // localStorage.setItem("dashboardType", "individual");
      }
    );
    builder.addCase(userSignIn.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const { setRecentSignupEmail } = AuthSlice.actions;

export default AuthSlice.reducer;
