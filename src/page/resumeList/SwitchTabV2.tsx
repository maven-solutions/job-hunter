import React from "react";
import { RootStore, useAppSelector } from "../../store/store";

const SwitchTabV2 = () => {
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const orgState: any = useAppSelector((store: RootStore) => {
    return store.OrgSlice;
  });

  return (
    <div className="segment-control" aria-label="Active applicant type">
      <label>
        {resumeList.individualSession ? "Individual" : ""}
        {orgState.orgSession ? "Organization" : ""}
      </label>
    </div>
  );
};

export default SwitchTabV2;
