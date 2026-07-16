import React from "react";
import { Eye } from "react-feather";

interface Screenshot {
  id: string;
  url: string;
}

interface ScreenshotGalleryProps {
  screenshots?: Screenshot[];
}

const ScreenshotGallery = ({ screenshots = [] }: ScreenshotGalleryProps) => {
  const count = screenshots.length;

  return (
    <section className="screenshots-section">
      <h2>
        Saved screenshots <span>· {count}</span>
      </h2>
      {count > 0 ? (
        <div className="ciautofill_v2_screenshot_icons">
          {screenshots.map((screenshot) => (
            <Eye
              key={screenshot.id}
              size={16}
              className="ciautofill_v2_screenshot_eye"
              onClick={() => window.open(screenshot.url, "_blank")}
            />
          ))}
        </div>
      ) : (
        <p>No screenshots yet — run Auto Fill, then capture this page.</p>
      )}
    </section>
  );
};

export default ScreenshotGallery;
