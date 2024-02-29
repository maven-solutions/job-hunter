import React from "react";
import ReactDOM from "react-dom/client";

import JobDetector from "../landingPage/DetectJob/JobDetector";

const App: React.FC<{}> = () => {
  return <JobDetector />;
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
