import React, { useState } from "react";
import "../LoginForm/index.css";
import Layout from "../../template/Layout";
import HeadingTitle from "../../component/heading/HeadingTitle";
import InputBox from "../../component/InputBox";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";
import { SHOW_PAGE } from "../../utils/constant";

const SignupForm = (props: any) => {
  const { setShowPage } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <Layout setShowPage={setShowPage}>
      <Height height="-15" />
      <div>
        <HeadingTitle title="Sing Up" />
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
            value={password}
            valueSetter={setPassword}
            name="password"
            placeholder="Enter your password"
          />
          <Height height="15" />

          <PrimaryButton loading={false} text="Sing Up" />
          <span className="ci_auth_form_or">OR</span>
          <span className="ci_auth_desc">
            Don’t have an account? &nbsp;
            <span
              className="ci_signup_link"
              onClick={() => setShowPage(SHOW_PAGE.loginPage)}
            >
              Sing In
            </span>
          </span>
        </WhiteCard>
      </div>
    </Layout>
  );
};

export default SignupForm;
