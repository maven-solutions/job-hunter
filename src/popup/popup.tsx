import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import LoginFrom from "../auth/LoginForm/LoginFrom";
import "./index.css";

const App: React.FC<{}> = () => {
  const [showPage, setShowPage] = useState<string>("");

  // console.log("popupfired::");

  return <LoginFrom setShowPage={setShowPage} popup />;
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
