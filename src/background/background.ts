// // TODO: background script
// chrome.runtime.onInstalled.addListener(() => {
//   // TODO: on installed function
// });
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "getLocalStorage") {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       const activeTab = tabs[0];
//       chrome.tabs.sendMessage(activeTab.id, {
//         action: "getLocalStorage",
//         key: request.key,
//       });
//     });
//   }
// });

import { EXTENSION_ACTION } from "../utils/constant";

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "localStorageResponse") {
//     console.log("Local storage data:", request.data);
//   }
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "getAccessToken") {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       const activeTab = tabs[0];
//       chrome.tabs.sendMessage(activeTab.id, { action: "getAccessToken" });
//     });
//   }
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "accessTokenResponse") {
//     const accessToken = request.accessToken;
//     console.log("Access Token:", accessToken);
//     // You can use the accessToken in your extension logic here
//   }
// });

// // Background script
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "urlChange") {
//     // console.log("URL changed to:", message.url);
//   }
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Message received:", message);
// });

// // Listen for messages from the content script
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Token stored: bg 1");

//   if (message.action === "login") {
//     console.log("Token stored: bg 2");
//     // Store the authentication token locally
//     chrome.storage.local.set({ token: message.token }, () => {
//       console.log("Token stored:", message.token);
//     });
//   }
// });
// Inside your service worker
// logOutRequestFromCareerAi;
chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse
) {
  // if (sender.url === blocklistedWebsite) return; // don't allow this web page access
  // if (request.openUrlInEditor) openUrl(request.openUrlInEditor);
  // console.log("reciver---::", request);

  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   chrome.tabs.sendMessage(
  //     tabs[0].id,
  //     { action: "open_dialog_box" },
  //     function (response) {}
  //   );
  // });

  if (request?.loginRequestFromCareerAi) {
    const data = request.loginRequestFromCareerAi;
    const token = request.loginRequestFromCareerAi.token;
    chrome.storage.local.set({
      ci_token: token,
    });
    chrome.storage.local.set({
      ci_user: data,
    });

    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: EXTENSION_ACTION.LOGIN_TO_CI_EXTENSION },
          function (response) {}
        );
      });
    });
  }
  if (request?.logOutRequestFromCareerAi) {
    // console.log("logout fired:::");
    chrome.storage.local.set({
      ci_token: null,
    });
    chrome.storage.local.set({
      ci_user: null,
    });

    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: EXTENSION_ACTION.LOGOUT_TO_CI_EXTENSION },
          function (response) {}
        );
      });
    });
  }
});
