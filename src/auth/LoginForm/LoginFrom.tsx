import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import HeadingTitle from "../../component/heading/HeadingTitle";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";

import {
  EXTENSION_IN_LIVE,
  EXTENSION_IN_LOCAL,
  EXTENSION_IN_STAGING,
  LIVE_WEBSITE_URL,
  STAGING_WEBSITE_URL,
} from "../../config/urlconfig";

const LoginFrom = (props: any) => {
  const { setShowPage, popup } = props;

  const userLogin = () => {
    if (EXTENSION_IN_LOCAL) {
      window.open("http://localhost:3000", "_blank");
    }
    if (EXTENSION_IN_STAGING) {
      window.open(STAGING_WEBSITE_URL, "_blank");
    }
    if (EXTENSION_IN_LIVE) {
      window.open(LIVE_WEBSITE_URL, "_blank");
    }
  };

  return (
    <Layout setShowPage={setShowPage} popup={popup}>
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
        <PrimaryButton text="Login" onclick={() => userLogin()} />
      </WhiteCard>
    </Layout>
  );
};

export default LoginFrom;
