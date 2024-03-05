import React, { useState } from "react";
import "./index.css";
import Layout from "../../template/Layout";
import HeadingTitle from "../../component/heading/HeadingTitle";
import InputBox from "../../component/InputBox";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import { userSignIn } from "../../store/features/Auth/AuthApi";

const LoginFrom = (props: any) => {
  const { setShowPage } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const userLogin = () => {
    const data: any = { email, password };
    dispatch(userSignIn(data));
  };
  return (
    <Layout setShowPage={setShowPage}>
      <Height height="-15" />
      <HeadingTitle title="Log in" />
      <Height height="10" />
      <WhiteCard>
        <InputBox
          title="Email"
          value={email}
          valueSetter={setEmail}
          name="email"
          placeholder="Enter your email"
        />
        <Height height="10" />

        <InputBox
          title="Password"
          type="password"
          value={password}
          valueSetter={setPassword}
          name="password"
          placeholder="Enter your password"
        />
        <Height height="10" />

        <div className="ci_form_row">
          <div
            className="ci_remember_section"
            onClick={() => setRememberMe(!rememberMe)}
          >
            <div className="ci_checkbox_section">
              {rememberMe && (
                <img src={chrome.runtime.getURL("tick.svg")} alt="tick-icon" />
              )}
            </div>
            <span className="ci_forgot_passord"> Remember me</span>
          </div>
          <span className="ci_forgot_passord"> Forgot password?</span>
        </div>
        <Height height="15" />

        <PrimaryButton
          text="Login"
          onclick={userLogin}
          loading={authState.loading.login}
          loadingText="please wait..."
        />
        <span className="ci_auth_form_or">OR</span>
        <span className="ci_auth_desc">
          Don’t have an account? &nbsp;
          <span className="ci_signup_link"> Sign up</span>
        </span>
      </WhiteCard>
    </Layout>
  );
};

export default LoginFrom;
