// TODO: background script
chrome.runtime.onInstalled.addListener(() => {
  // TODO: on installed function
});
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   if (request.action === "generateDynamicURL") {
//     var dynamicURL = `${request.inputValue}`;
//     sendResponse({ url: dynamicURL });
//   }
// });

// Background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "urlChange") {
    // console.log("URL changed to:", message.url);
  }
});
