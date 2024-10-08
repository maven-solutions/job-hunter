import React, { useEffect, useState } from "react";

import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import HeadingTitle from "../../component/heading/HeadingTitle";
import AutofillFields from "./AutofillFields";
import "./index.css";
import "./index2.css";
import AutofillLoader from "./AutofillLoader";

const ResumeList = (props: any) => {
  const { setShowPage, autoFilling, setAutoFilling, showPage } = props;

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <Height height="-10" />
      <HeadingTitle title="Fill Data" />
      <Height height="10" />
      {/* {iframeUrl && <IframError setIframeUrl={setIframeUrl} />} */}

      <WhiteCard>{autoFilling && <AutofillLoader />} </WhiteCard>

      <Height height="10" />

      <div className="ciautofill_v2_resume_autofill_button_section">
        <AutofillFields setAutoFilling={setAutoFilling} />
      </div>
    </Layout>
  );
};

export default ResumeList;
