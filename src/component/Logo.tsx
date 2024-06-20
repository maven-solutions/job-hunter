import React, { useRef, useState } from "react";
import { SHOW_PAGE } from "../utils/constant";
import { RootStore, useAppDispatch, useAppSelector } from "../store/store";
import { setToken, setUser } from "../store/features/Auth/AuthSlice";

const Logo = (props: any) => {
  const { setShowPage, jobFound, showAutofillPage } = props;
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const dispatch = useAppDispatch();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startY, setStartY] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const draggableRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: any) => {
    setIsDragging(true);
    setStartY(e.clientY);
    if (draggableRef.current) {
      setOffsetY(draggableRef.current.offsetTop);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging) return;

    if (draggableRef.current) {
      const newOffsetY = offsetY + e.clientY - startY;
      draggableRef.current.style.top = `${newOffsetY}px`;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
      if (authState.ci_user.userType === "va") {
        setShowPage(SHOW_PAGE.resumeListPage);
      } else if (showAutofillPage) {
        setShowPage(SHOW_PAGE.resumeListPage);
      } else {
        setShowPage(SHOW_PAGE.summaryPage);
      }
    } else {
      setShowPage(SHOW_PAGE.loginPage);
    }
  };
  return (
    <div
      className={`job_circle_button ${jobFound && "ci-shake-logo"}`}
      role="button"
      // ref={draggableRef}
      onClick={handlePage}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {jobFound && <span className="job__post__detected">1</span>}
      <img src={chrome.runtime.getURL("logo.svg")} alt="logo-icon" />
    </div>
  );
};

export default Logo;
