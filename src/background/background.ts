import { EXTENSION_ACTION } from "../utils/constant";

// Inside your service worker
// logOutRequestFromCareerAi;
chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse
) {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action !== EXTENSION_ACTION.CAPTURE_VISIBLE_TAB) {
    return false;
  }

  const respondWithCapture = (windowId: number | undefined) => {
    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
      const errorMessage = chrome.runtime.lastError?.message;
      if (errorMessage || !dataUrl) {
        // Fallback to current window when sender tab window is unavailable.
        if (windowId !== undefined) {
          respondWithCapture(undefined);
          return;
        }
        sendResponse({
          success: false,
          error: errorMessage || "Unable to capture visible tab",
        });
        return;
      }

      sendResponse({ success: true, dataUrl });
    });
  };

  respondWithCapture(sender.tab?.windowId);

  return true;
});

// chrome.runtime.onMessageExternal.addListener(function (
//   request,
//   sender,
//   sendResponse
// ) {
//   if (request?.loginRequestFromCareerAi) {
//     const data = request.loginRequestFromCareerAi;
//     const token = request.loginRequestFromCareerAi.token;
//     chrome.storage.local.set({
//       ci_token: token,
//     });
//     chrome.storage.local.set({
//       ci_user: data,
//     });

//     chrome.tabs.query({ currentWindow: true }, function (tabs) {
//       tabs.forEach(function (tab) {
//         chrome.tabs.sendMessage(
//           tab.id,
//           { action: EXTENSION_ACTION.LOGIN_TO_CI_EXTENSION },
//           function (response) {
//             // Send an empty response asynchronously
//             setTimeout(() => {
//               sendResponse({});
//             }, 0);
//           }
//         );
//       });
//     });
//     // Return true to indicate that sendResponse will be called asynchronously
//     return true;
//   }
//   if (request?.logOutRequestFromCareerAi) {
//     chrome.storage.local.set({
//       ci_token: null,
//     });
//     chrome.storage.local.set({
//       ci_user: null,
//     });

//     chrome.tabs.query({ currentWindow: true }, function (tabs) {
//       tabs.forEach(function (tab) {
//         chrome.tabs.sendMessage(
//           tab.id,
//           { action: EXTENSION_ACTION.LOGOUT_TO_CI_EXTENSION },
//           function (response) {
//             // Send an empty response asynchronously
//             setTimeout(() => {
//               sendResponse({});
//             }, 0);
//           }
//         );
//       });
//     });
//     // Return true to indicate that sendResponse will be called asynchronously
//     return true;
//   }
// });
