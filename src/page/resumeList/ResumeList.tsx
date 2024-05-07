import React, { useEffect, useState } from "react";
import { Check, Eye } from "react-feather";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import HeadingTitle from "../../component/heading/HeadingTitle";
import AutofillFields from "./AutofillFields";
import "./index.css";

const ResumeList = (props: any) => {
  const { setShowPage, content } = props;

  const [showdropDown, setShowDropdown] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedResume, setSelectedResume] = useState(0);
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  // console.log("resume::", resumeList);

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (authState.authenticated && authState?.ci_user?.userType === "va") {
      if (!resumeList.res_success || resumeList.applicantData.length === 0) {
        dispatch(getApplicantsData());
      }
    } else {
      dispatch(getApplicantResume());
    }
  }, []);

  const showActionMenu = (index: any) => {
    setCurrentIndex(index);
    setShowDropdown(!showdropDown);
  };

  const handleChangeSelecetedResume = (index: number) => {
    setSelectedResume(index);
  };

  return (
    <Layout setShowPage={setShowPage} firstBgWidth="10">
      <Height height="-10" />
      <HeadingTitle title="Resume List" />
      <Height height="10" />

      <WhiteCard>
        {resumeList.applicantData.map((item, index) => (
          <div className="ci_resume_list_section" key={item.applicant.id}>
            <div className="ci_resume_item_left_section">
              <input
                className="ci_resume_radio_button"
                type="radio"
                name="resume"
                id={index}
                onChange={() => setSelectedResume(index)}
                checked={selectedResume === index}
              />
              <label htmlFor={index} className="ci_resume_radio_button_label">
                {item.applicant.title ?? `Untitled - ${item.applicant.name}`}
              </label>
              {selectedResume === index && (
                <div className="ci_radio_check_circle">
                  <Check className="ci_check_icon" />
                </div>
              )}
            </div>
            <div className="ext__tooltip__wrapper">
              <div className="ext__toolip__container">
                <div
                  className="ext__toolip"
                  onClick={() => window.open(item.applicant.pdfUrl, "_blank")}
                >
                  <Eye size={16} />
                  <p className="ext__tooltip__text">Preview</p>
                </div>
                {/* <div className="ext__toolip">
                  <Trash2 size={16} />
                  <p className="ext__tooltip__text">Delete</p>
                </div> */}
              </div>
            </div>
          </div>
        ))}
        <Height height="10" />

        <AutofillFields selectedResume={selectedResume} content={content} />
      </WhiteCard>
    </Layout>
  );
};

export default ResumeList;
