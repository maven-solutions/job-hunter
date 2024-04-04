import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import Store from "../store/store";
import JobDetector from "../landingPage/DetectJob/JobDetector";
import "./index.css";

const App: React.FC<{}> = () => {
  console.log("popupfired::");

  return (
    // <Provider store={Store}>
    //   <JobDetector popup={true} />
    // </Provider>
    null
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
