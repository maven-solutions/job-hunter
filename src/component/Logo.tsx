import React from "react";
import { SHOW_PAGE } from "../utils/constant";
import { RootStore, useAppDispatch, useAppSelector } from "../store/store";
import { setToken, setUser } from "../store/features/Auth/AuthSlice";

const Logo = (props: any) => {
  const { setShowPage, jobFound } = props;
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const dispatch = useAppDispatch();
  const loadUser = () => {
    chrome.storage.local.get(["ci_user"]).then((result) => {
      const data = result.ci_user;
      dispatch(setUser(data));
    });
    chrome.storage.local.get(["ci_token"]).then((result: any) => {
      const data = result.ci_token;
      dispatch(setToken(data));
    });
  };

  const handlePage = () => {
    loadUser();
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
