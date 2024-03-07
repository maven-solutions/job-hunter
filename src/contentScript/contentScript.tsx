import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import JobDetector from "../landingPage/DetectJob/JobDetector";
import Store from "../store/store";

const App: React.FC<{}> = () => {
  useEffect(() => {
    // window.addEventListener("message", (event) => {
    //   if (event.source !== window) return;
    //   const message = event.data;
    //   if (message.action === "getAccessToken") {
    //     const accessToken = localStorage.getItem("access_token");
    //     console.log("a---", accessToken);
    //     window.postMessage({ action: "accessTokenResponse", accessToken }, "*");
    //   }
    // });
    // contentScript.js
    // Listen for messages from the website
    // Inside your content script
    // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //   console.log("Data message:", message);
    //   console.log("sender message:", sender);
    //   // Check if the message contains the data you're expecting
    //   if (message && message.data) {
    //     const dataFromServiceWorker = message.data;
    //     // Now you can use dataFromServiceWorker in your content script
    //     console.log("Data from service worker:", dataFromServiceWorker);
    //   }
    // });
  }, []);
  // window.addEventListener("message", (event) => {
  //   console.log("a--1-", event);

  //   if (event.data && event.data.action === "login") {
  //     console.log("a--2-", event);
  //     // Send the authentication token to the background script
  //     chrome.runtime.sendMessage({
  //       action: "login",
  //       token: event.data.token,
  //     });
  //   }
  // });
  // console.log("Content script is running");

  // window.addEventListener("message", (event) => {
  //   console.log("Message received:", event);
  // });
  return (
    <Provider store={Store}>
      <JobDetector />
    </Provider>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
