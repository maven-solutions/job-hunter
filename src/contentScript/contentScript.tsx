import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import JobDetector from "../landingPage/DetectJob/JobDetector";
import Store from "../store/store";

const App: React.FC<{}> = () => {
  const [htmlElement, setHtmlElement] = useState<any>("");
  const [elementInfo, setElementInfo] = useState<any>("");
  useEffect(() => {
    // contentScript.js
    let lastHoveredElement = null;

    function handleMouseOver(event) {
      const target = event.target;
      if (target) {
        // Remove the border from the last hovered element
        if (lastHoveredElement) {
          lastHoveredElement.style.outline = "";
        }

        // Add a border to the current hovered element
        target.style.outline = "2px solid red";

        // Store the current hovered element
        lastHoveredElement = target;
      }
    }

    function handleClick(event) {
      const target = event.target;
      if (target) {
        // Log the element information to the console
        const elementInfo = {
          tagName: target.tagName,
          className: target.className,
          attributes: Array.from(target.attributes).map((attr: any) => ({
            name: attr.name,
            value: attr.value,
          })),
          outerHTML: target.outerHTML,
        };
        setHtmlElement(target.outerHTML);
        console.log("Clicked Element Info:", elementInfo);
        // setElementInfo(elementInfo);
      }
    }

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("click", handleClick);
  }, []);

  return (
    <Provider store={Store}>
      <JobDetector
        content={true}
        htmlElement={htmlElement}
        elementInfo={elementInfo}
      />
    </Provider>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
