import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: any = {
  loading: false,
  avatar_loading: false,
  forget_password_loading: false,
  reset_password_loading: "null",
  token_loading: false,
  logout_loading: false,
  loaduser_loading: false,
  update_user_loading: false,
  req_success: false,
  load_user_success: false,
  logout_success: false,
  pass_req_success: false,
  default_pass_req_success: false,
  token_success: false,
  forget_password_success: false,
  reset_password_success: false,
  update_user_req_success: false,
  email_validated: false,
  recent_signup_email: null,
  authenticated: false,
  load_user: null,
  tac_user: null,
  access_token: null,
  login_fail: false,
  member_verify_token_loading: false,
  member_verify_token_success: false,
  member_signup_success: false,
  member_signup_loading: false,
  tenant: "",
  tenant_pay_details: {},
  theme_name: "",
};

const AuthSlice = createSlice({
  name: "userSignUp",
  initialState,
  reducers: {
    setRecentSignupEmail: (state: any, { payload }: PayloadAction<string>) => {
      state.recent_signup_email = payload;
    },
    setVerifiedDomain: (state: any) => {
      state.verified_domain = true;
    },
    activatePaidPlanForUser: (state: any) => {
      state.tac_user.plan = "paid";
    },
    setThemeName: (state: any, { payload }: PayloadAction<string>) => {
      state.theme_name = payload;
    },
    deActivatePaidPlanForUser: (state: any) => {
      state.tac_user.plan = "free";
    },
    googleUserSignIn: (state: any, { payload }: PayloadAction<any>) => {
      localStorage.setItem("tac_user", JSON.stringify(payload.user));
      localStorage.setItem("access_token", payload.access_token);
      state.loading = false;
      state.logout_success = false;
      state.req_success = true;
      state.pass_req_success = false;

      // state.authenticated = true;
      state.tac_user = payload.user;
      state.access_token = payload.access_token;
    },
    populateUserFromGoogleSignIn: (
      state: any,
      { payload }: PayloadAction<any>
    ) => {
      localStorage.setItem("tac_user", JSON.stringify(payload.user));
      localStorage.setItem("access_token", payload.access_token);
      state.loading = false;
      state.logout_success = false;
      state.req_success = true;
      state.pass_req_success = false;

      // state.authenticated = true;
      state.tac_user = payload.user;
      state.access_token = payload.access_token;
    },
  },
});

export const {
  setRecentSignupEmail,
  setVerifiedDomain,
  googleUserSignIn,
  populateUserFromGoogleSignIn,
  activatePaidPlanForUser,
  deActivatePaidPlanForUser,
  setThemeName,
} = AuthSlice.actions;

export default AuthSlice.reducer;
