import React from "react";
import ReactDOM from "react-dom/client";

const App: React.FC<{}> = () => {
  // console.log("popupfired::");

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
