import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import JobDetector from "../landingPage/DetectJob/JobDetector";
import Store from "../store/store";
import { EXTENSION_ROOT_ID } from "../utils/constant";

const App: React.FC<{}> = () => {
  return (
    <Provider store={Store}>
      <JobDetector content={true} />
    </Provider>
  );
};

const root = document.createElement("div");
root.id = EXTENSION_ROOT_ID;
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
