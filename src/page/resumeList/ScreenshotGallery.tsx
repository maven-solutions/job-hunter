import React from "react";
import { ExternalLink, Loader, Trash2 } from "react-feather";
import { deleteIndividualSessionScreenshot } from "../../store/features/ResumeList/ResumeListApi";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";

interface Screenshot {
  id: string;
  url: string;
}

interface ScreenshotGalleryProps {
  screenshots?: Screenshot[];
}

const ScreenshotGallery = ({ screenshots = [] }: ScreenshotGalleryProps) => {
  const dispatch = useAppDispatch();
  const { deletingScreenshotId, screenshotDeleteError } = useAppSelector(
    (store: RootStore) => store.ResumeListSlice,
  );
  const count = screenshots.length;

  const handleDelete = (screenshot: Screenshot) => {
    const shouldDelete = window.confirm(
      "Delete this screenshot? This action cannot be undone.",
    );

    if (shouldDelete) {
      dispatch(deleteIndividualSessionScreenshot(screenshot.id));
    }
  };

  return (
    <section className="screenshots-section">
      <h2>
        Saved screenshots <span>· {count}</span>
      </h2>
      {count > 0 ? (
        <div className="ciautofill_v2_screenshot_grid">
          {screenshots.map((screenshot) => (
            <article
              className="ciautofill_v2_screenshot_card"
              key={screenshot.id}
            >
              <a
                className="ciautofill_v2_screenshot_link"
                href={screenshot.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open screenshot in a new tab"
                title="Open screenshot in a new tab"
              >
                <img
                  src={screenshot.url}
                  alt="Saved application screenshot"
                  loading="lazy"
                />
                <span className="ciautofill_v2_screenshot_open">
                  <ExternalLink size={14} aria-hidden="true" />
                </span>
              </a>
              <button
                className="ciautofill_v2_screenshot_delete"
                type="button"
                onClick={() => handleDelete(screenshot)}
                disabled={deletingScreenshotId === screenshot.id}
                aria-label="Delete screenshot"
                title="Delete screenshot"
              >
                {deletingScreenshotId === screenshot.id ? (
                  <Loader
                    className="ciautofill_v2_screenshot_spinner"
                    size={15}
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 size={15} aria-hidden="true" />
                )}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p>No screenshots yet — run Auto Fill, then capture this page.</p>
      )}
      {screenshotDeleteError && (
        <p className="ciautofill_v2_screenshot_error" role="alert">
          {screenshotDeleteError}
        </p>
      )}
    </section>
  );
};

export default ScreenshotGallery;
