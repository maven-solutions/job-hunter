import React, { useEffect, useState } from "react";

import WebMonitor from "./WebMonitor";

const JobDetector = (props: any) => {
  const { htmlElement, elementInfo } = props;
  return <WebMonitor htmlElement={htmlElement} elementInfo={elementInfo} />;
};

export default JobDetector;
