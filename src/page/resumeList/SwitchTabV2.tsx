import React from "react";
import { RootStore, useAppSelector } from "../../store/store";

const SwitchTabV2 = () => {
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const orgState: any = useAppSelector((store: RootStore) => {
    return store.OrgSlice;
  });

  const hasSession = resumeList.individualSession || orgState.orgSession;

  return (
    <div className="segment-control" aria-label="Active applicant type">
      {!hasSession ? (
        <div style={{ width: "100px", height: "30px" }} />
      ) : (
        <label>
          {resumeList.individualSession ? "Individual" : ""}
          {orgState.orgSession ? "Organization" : ""}
        </label>
      )}
    </div>
  );
};

export default SwitchTabV2;
