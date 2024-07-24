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
            Unfortunately, our autofill functionality is not supported on this
            page. Please fill in the details manually.
          </span>
        </div>
      </WhiteCard>
    </Layout>
  );
};

export default Error;
