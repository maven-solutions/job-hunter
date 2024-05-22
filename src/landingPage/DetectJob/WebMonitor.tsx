import React, { useEffect, useState } from "react";
import "./monitor.css";

interface ElementInfo {
  tagName: string;
  className: string;
  attributes: { name: string; value: string }[];
  outerHTML: string;
}
const WebMonitor = (props: any) => {
  const { htmlElement, elementInfo } = props;
  // const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);
  // useEffect(() => {
  //   chrome.runtime.onMessage.addListener((message: ElementInfo) => {
  //     setElementInfo(message);
  //   });
  // }, []);

  return (
    <div className="bot-web-monitor">
      <div className="bot-web-monitor-title-section">title</div>
      <div>
        <h1>Hover Info Extension</h1>
        {htmlElement}
        {elementInfo && (
          <div>
            <h2>Hovered Element Info:</h2>
            <p>
              <strong>Tag Name:</strong> {elementInfo.tagName}
            </p>
            <p>
              <strong>Class Name:</strong> {elementInfo.className}
            </p>
            <h3>Attributes:</h3>
            <ul>
              {elementInfo.attributes.map((attr, index) => (
                <li key={index}>
                  <strong>{attr.name}:</strong> {attr.value}
                </li>
              ))}
            </ul>
            <h3>Outer HTML:</h3>
            <pre>{elementInfo.outerHTML}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebMonitor;
