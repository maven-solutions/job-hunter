import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";

const Error = (props: any) => {
  const { setShowPage, content, autoFilling, setAutoFilling, showPage } = props;
  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <WhiteCard>
        <div className="ci_auofill_error_wrapper">
          <span className="ci_auofill_error_titile">
            {" "}
            Autofill not work on this page
          </span>
        </div>
      </WhiteCard>
    </Layout>
  );
};

export default Error;
