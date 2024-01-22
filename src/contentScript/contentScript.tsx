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
            width="81"
            height="81"
            viewBox="0 0 81 81"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter="url(#filter0_d_397_44)">
              <path
                d="M8 16C8 10.4772 12.4772 6 18 6H73V71H18C12.4772 71 8 66.5228 8 61V16Z"
                fill="#0145FD"
              />
              <path
                d="M52.2279 32.4423C53.8472 31.6059 54.5047 29.5871 53.3633 28.1662C51.8097 26.2324 49.8307 24.6623 47.5633 23.5883C44.2953 22.0403 40.6092 21.6087 37.0719 22.36C33.5347 23.1113 30.3423 25.0038 27.9855 27.7465C25.6288 30.4892 24.2383 33.9301 24.0279 37.5401C23.8176 41.1501 24.799 44.7293 26.8212 47.7271C28.8434 50.725 31.7944 52.9755 35.2204 54.1325C38.6464 55.2896 42.3577 55.2891 45.7834 54.1312C48.1602 53.3279 50.3082 51.9982 52.0759 50.2579C53.3747 48.9793 52.9561 46.8978 51.4449 45.879V45.879C49.9337 44.8602 47.9032 45.3208 46.446 46.4155C45.6099 47.0436 44.674 47.5394 43.6701 47.8787C41.6146 48.5735 39.3879 48.5738 37.3323 47.8795C35.2766 47.1853 33.506 45.835 32.2927 44.0363C31.0794 42.2376 30.4905 40.0901 30.6168 37.9241C30.743 35.7581 31.5773 33.6935 32.9913 32.0479C34.4054 30.4023 36.3208 29.2668 38.4432 28.816C40.5655 28.3652 42.7772 28.6242 44.738 29.553C45.6957 30.0066 46.5677 30.6078 47.3252 31.3288C48.6454 32.5852 50.6086 33.2787 52.2279 32.4423V32.4423Z"
                fill="#FFB400"
              />
              <path
                d="M52.2119 32.4509C53.8402 31.61 54.5014 29.5799 53.3522 28.1525C52.6109 27.2317 51.7708 26.3908 50.8449 25.6457C49.0542 24.2046 46.9823 23.1536 44.7618 22.5599C42.5413 21.9662 40.2213 21.843 37.9504 22.1982C36.7762 22.3818 35.6285 22.6913 34.5266 23.1192C32.8183 23.7827 32.3783 25.8719 33.3696 27.4132V27.4132C34.3608 28.9545 36.4198 29.3347 38.202 28.9077C38.4574 28.8466 38.7155 28.7955 38.9758 28.7548C40.3334 28.5425 41.7203 28.6161 43.0477 28.971C44.3751 29.3259 45.6137 29.9542 46.6842 30.8157C46.8894 30.9809 47.0877 31.154 47.2784 31.3344C48.6097 32.5938 50.5837 33.2919 52.2119 32.4509V32.4509Z"
                fill="white"
              />
              <path
                d="M51.6148 45.8282C53.1733 46.8492 53.6296 48.9722 52.3134 50.2909C51.4914 51.1145 50.5823 51.8511 49.6002 52.4867C47.6706 53.7356 45.5014 54.5676 43.2315 54.9293C40.9617 55.291 38.6413 55.1745 36.4191 54.5872C35.288 54.2883 34.1951 53.8708 33.1578 53.3435C31.4969 52.4992 31.2707 50.3396 32.4347 48.8847V48.8847C33.5986 47.4298 35.7218 47.2633 37.4852 47.8651C37.7017 47.939 37.9211 48.0053 38.143 48.064C39.4565 48.4111 40.828 48.48 42.1697 48.2662C43.5114 48.0524 44.7935 47.5606 45.9341 46.8224C46.1268 46.6977 46.3147 46.5664 46.4975 46.4289C47.9865 45.3089 50.0563 44.8072 51.6148 45.8282V45.8282Z"
                fill="white"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_397_44"
                x="0"
                y="0"
                width="81"
                height="81"
                filterUnits="userSpaceOnUse"
                // color-interpolation-filters="sRGB"
              >
                {/* <feFlood flood-opacity="0" result="BackgroundImageFix" /> */}
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="4" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_397_44"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_397_44"
                  result="shape"
                />
              </filter>
            </defs>
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
