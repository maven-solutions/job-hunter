import React, { useEffect, useState } from "react";
import { Check, Eye } from "react-feather";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
  getDesignations,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import HeadingTitle from "../../component/heading/HeadingTitle";
import AutofillFields from "./AutofillFields";
import "./index.css";
import "./index2.css";
import Spinner from "../shared/Spinner";
import { ResumeSkleton } from "../../component/skleton/Skleton";
import IframError from "./IframError";
import AutofillLoader from "./AutofillLoader";

const ResumeList = (props: any) => {
  const { setShowPage, content, autoFilling, setAutoFilling, showPage } = props;

  const [selectedResume, setSelectedResume] = useState(0);
  const [iframeUrl, setIframeUrl] = useState("");

  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  // console.log("resumeList", resumeList);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getDesignations());
  }, []);

  const RenderName = (props: any) => {
    const { item } = props;
    if (item?.applicant?.title) {
      return item.applicant.title;
    }
    if (item?.applicant?.name) {
      return item.applicant.name;
    }
    return "Untitled Resume";
  };

  const getRoleById = (roleiId, customRole) => {
    if (roleiId) {
      const role = resumeList.allRoles.filter((role) => {
        return role.id === roleiId;
      });
      if (!role || role.length === 0) {
        return null;
      }
      return role[0].title;
    }
    if (customRole) {
      return customRole?.label;
    }
  };
  useEffect(() => {
    // for organization student
    if (
      authState.authenticated &&
      authState?.ci_user?.organizations[0]?.role?.id === 3
    ) {
      dispatch(getApplicantResume(authState?.ci_user?.organizations[0].id));
      return;
    }

    if (authState.authenticated && authState?.ci_user?.userType === "va") {
      if (!resumeList.res_success || resumeList.applicantData.length === 0) {
        // for va user
        dispatch(getApplicantsData());
      }
    } else {
      // for normal user
      if (!resumeList.res_success) {
        dispatch(getApplicantResume(null));
      }
    }
  }, []);

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <Height height="-10" />
      <HeadingTitle title="Resume List" />
      <Height height="10" />
      {iframeUrl && <IframError setIframeUrl={setIframeUrl} />}

      <WhiteCard>
        {!autoFilling && (
          <div className="ciautofill__resmelist__wrapper">
            <Height height="-10" />

            {resumeList.res_success &&
              resumeList.applicantData.map((item, index) => {
                return (
                  <div
                    className="ciautofill_single_resume"
                    key={item.applicant.id}
                  >
                    <div
                      className="ciautofill__radio__button__section"
                      onClick={() => setSelectedResume(index)}
                    >
                      {selectedResume === index && (
                        <div className="ciautofill__radio__checked" />
                      )}
                    </div>
                    <span
                      className="ciautofill_resume_name"
                      onClick={() => setSelectedResume(index)}
                    >
                      <RenderName item={item} resumeList={resumeList} />
                    </span>
                    {selectedResume === index && (
                      <div className="ciautofill__checkbox__section">
                        <Check className="ciautofill__check__icon" />
                      </div>
                    )}

                    <div className="ext__tooltip__wrapper">
                      <div className="ext__toolip__container">
                        <div
                          className="ext__toolip"
                          onClick={() =>
                            window.open(item.applicant.pdfUrl, "_blank")
                          }
                        >
                          <Eye size={16} />
                          <p className="ext__tooltip__text">Preview</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {resumeList.loading && <ResumeSkleton />}
            <Height height="10" />
            <AutofillFields
              selectedResume={selectedResume}
              content={content}
              setAutoFilling={setAutoFilling}
              setIframeUrl={setIframeUrl}
            />
          </div>
        )}
        {autoFilling && <AutofillLoader />}{" "}
      </WhiteCard>
    </Layout>
  );
};

export default ResumeList;
