import React, { useState } from "react";
import "./index.css";
import Layout from "../../template/Layout";
import HeadingTitle from "../../component/heading/HeadingTitle";
import InputBox from "../../component/InputBox";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";

const LoginFrom = (props: any) => {
  const { setShowFrom } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <Layout setShowFrom={setShowFrom}>
      <div>
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
            value={password}
            valueSetter={setPassword}
            name="password"
            placeholder="Enter your password"
          />
          <Height height="15" />

          <PrimaryButton loading={false} text="Login" />
          <span className="ci_auth_form_or">OR</span>

          <span className="ci_auth_desc">
            Don’t have an account? &nbsp;
            <span className="ci_signup_link"> Sign up</span>
          </span>
        </WhiteCard>
      </div>
    </Layout>
  );
};

export default LoginFrom;
