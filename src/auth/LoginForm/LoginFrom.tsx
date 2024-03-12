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
import { SHOW_PAGE } from "../../utils/constant";

const LoginFrom = (props: any) => {
  const { setShowPage } = props;

  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const userLogin = () => {
    window.open("http://localhost:3000", "_blank");
  };
  return (
    <Layout setShowPage={setShowPage}>
      <Height height="-15" />
      <HeadingTitle title="Log in to CareerAI" />
      <Height height="10" />
      <WhiteCard>
        <div className="ci_login_image_wrapper">
          {" "}
          <img src={chrome.runtime.getURL("login.svg")} />
        </div>
        <p className="ci_login_desc">
          {" "}
          Log in now with CareerAi to enhance your job search experience and
          discover your dream job.
        </p>
        <PrimaryButton
          text="Login"
          onclick={userLogin}
          loading={authState.loading.login}
          loadingText="please wait..."
        />
      </WhiteCard>
    </Layout>
  );
};

export default LoginFrom;
