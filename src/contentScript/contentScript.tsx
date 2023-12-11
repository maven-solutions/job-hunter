// TODO: content script
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useDebounce } from 'use-debounce';
import './index.css';
import JobFrom from './JobFrom';

const App: React.FC<{}> = () => {
  const [showFrom, setShowFrom] = useState<boolean>(false);
  const [showIcon, setShowIcon] = useState<boolean>(false);
  useEffect(() => {
    if (
      ['linkedin', 'indeed', 'dice', 'ziprecruiter'].some((domain) =>
        window.location.href.includes(domain)
      )
    ) {
      setShowIcon(true);
    }
  }, []);

  return (
    <div className="content__script__section">
      {showIcon ? (
        <div
          className="job_circle_button"
          role="button"
          onClick={() => setShowFrom(!showFrom)}
        >
          <svg
            className="svg-icon"
            style={{ color: '#fff', background: 'blue', fill: 'white' }}
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M768 785.066667a17.015467 17.015467 0 0 1-12.066133-5.000534l-256-256a17.0496 17.0496 0 0 1 0-24.132266l256-256a17.0496 17.0496 0 1 1 24.132266 24.132266L536.132267 512l243.933866 243.933867A17.0496 17.0496 0 0 1 768 785.066667z m-256 0a17.015467 17.015467 0 0 1-12.066133-5.000534l-256-256a17.0496 17.0496 0 0 1 0-24.132266l256-256a17.0496 17.0496 0 1 1 24.132266 24.132266L280.132267 512l243.933866 243.933867A17.0496 17.0496 0 0 1 512 785.066667z" />
          </svg>
          {/* <img
            src={chrome.runtime.getURL('icon.png')}
            className="job_circle_button_img"
            alt="logo"
          /> */}
        </div>
      ) : null}
      {showFrom && <JobFrom />}
    </div>
  );
};

const root = document.createElement('div');
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
