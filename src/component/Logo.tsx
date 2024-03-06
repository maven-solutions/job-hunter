import React from "react";
import { SHOW_PAGE } from "../utils/constant";
import { RootStore, useAppSelector } from "../store/store";

const Logo = (props: any) => {
  const { setShowPage, jobFound } = props;
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const handlePage = () => {
    if (authState.authenticated) {
      setShowPage(SHOW_PAGE.summaryPage);
    } else {
      setShowPage(SHOW_PAGE.loginPage);
    }
  };
  return (
    <div
      className={`job_circle_button ${jobFound && "ci-shake-logo"}`}
      role="button"
      onClick={handlePage}
    >
      {jobFound && <span className="job__post__detected">1</span>}
      <img src={chrome.runtime.getURL("logo.svg")} alt="logo-icon" />
    </div>
  );
};

export default Logo;
