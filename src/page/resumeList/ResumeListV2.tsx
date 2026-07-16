import React from "react";
import { ResumeSkleton } from "../../component/skleton/Skleton";
import RenderName from "./RenderName";

interface ResumeListV2Props {
  loading: boolean;
  success: boolean;
  resumes: any[];
  selectedIndex: number;
  resumeList: any;
  onSelect: (index: number) => void;
  onPreview: (pdfUrl: string) => void;
}

const ResumeListV2 = ({
  loading,
  success,
  resumes,
  selectedIndex,
  resumeList,
  onSelect,
  onPreview,
}: ResumeListV2Props) => {
  return (
    <section className="form-section">
      <p className="section-label">Resume</p>
      <div className="resume-list">
        {loading && <ResumeSkleton />}
        {success &&
          resumes.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <label
                className={`resume-card ${isSelected ? "is-selected" : ""}`}
                key={item.id}
              >
                <input
                  type="radio"
                  name="resume"
                  checked={isSelected}
                  onChange={() => onSelect(index)}
                />
                <span aria-hidden="true" className="custom-radio" />
                <span className="resume-name">
                  <RenderName item={item} resumeList={resumeList} />
                </span>
                {item?.pdfUrl && (
                  <button
                    aria-label="Preview resume"
                    className="preview-button"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPreview(item?.pdfUrl);
                    }}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                )}
              </label>
            );
          })}
      </div>
    </section>
  );
};

export default ResumeListV2;
