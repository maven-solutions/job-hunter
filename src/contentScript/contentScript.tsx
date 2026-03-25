import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import JobDetector from "../landingPage/DetectJob/JobDetector";
import Store from "../store/store";

const OVERLAY_SELECTOR = 'div[data-element="overlay"][data-izone="stop"]';
const OVERLAY_WRAPPER_SELECTOR = "div.E5IaTEuzNAtsJSrBDlFn.NQ6alkHq2U4lSLOovb0Y";

const removeOverlayPopup = (target: ParentNode = document) => {
  const overlays = target.querySelectorAll(OVERLAY_SELECTOR);
  overlays.forEach((overlay) => {
    const wrapper = overlay.closest(OVERLAY_WRAPPER_SELECTOR);
    if (wrapper) {
      wrapper.remove();
      return;
    }
    overlay.remove();
  });
};

const startOverlayRemovalWatcher = () => {
  removeOverlayPopup();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) {
          return;
        }

        if (node.matches(OVERLAY_SELECTOR)) {
          const wrapper = node.closest(OVERLAY_WRAPPER_SELECTOR);
          if (wrapper) {
            wrapper.remove();
            return;
          }
          node.remove();
          return;
        }

        removeOverlayPopup(node);
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

const App: React.FC<{}> = () => {
  return (
    <Provider store={Store}>
      <JobDetector content={true} />
    </Provider>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
startOverlayRemovalWatcher();
rootElement.render(<App />);
