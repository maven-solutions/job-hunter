// TODO: content script
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import InputBox from "../component/InputBox";
const App: React.FC<{}> = () => {
  const [isActive, setIsActive] = useState<any>(window.location.href);

  useEffect(() => {
    console.log("url----", window.location.href);
  }, [window.location]);

  // useEffect(() => {}, [isActive]);

  return (
    <div className="content__script__section">
      <div className="job_circle_button">JH</div>
      <div className="job__detail__container">
        <div className="job_detail_header"> Jobs Hunter </div>
        <div className="job_detail_content_section">
          <InputBox title="Job title" />
          <InputBox title="Company" />
          <InputBox title="Location" />
          <InputBox title="Post Url" />
          <InputBox title="Description" />
        </div>
        <div className="job__detail__footer">
          <button className="job_save_button">Save</button>
        </div>
      </div>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(<App />, root);
