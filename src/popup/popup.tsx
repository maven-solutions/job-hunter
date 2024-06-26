import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import LoginFrom from "../auth/LoginForm/LoginFrom";
import "./index.css";
import PopUpDetailPage from "../page/popupDetail/PopUpDetailPage";

const App: React.FC<{}> = () => {
  const [showPage, setShowPage] = useState<string>("");
  const [auth, setAuth] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<boolean>(false);
  useEffect(() => {
    chrome.storage.local.get(["ci_user"]).then((result) => {
      const data = result.ci_user;
      if (data) {
        setAuth(true);
      }
    });
  }, []);

  // if (auth) {
  //   return <LoginFrom setShowPage={setShowPage} popup />;
  // }
  return <PopUpDetailPage setShowPage={setShowPage} popup />;
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
