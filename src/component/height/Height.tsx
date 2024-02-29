import React from "react";

const Height = (props: any) => {
  const { height } = props;
  return <div style={{ marginTop: `${height}px` }} />;
};

export default Height;
