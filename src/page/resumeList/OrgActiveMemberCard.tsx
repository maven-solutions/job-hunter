import React, { memo, useEffect, useMemo } from "react";
import { getInitials } from "./helper";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  setResumeIndex,
  setUserIndex,
} from "../../store/features/ResumeList/ResumeListSlice";

interface ApplicantDataItem {
  id: number;
  applicantId: number;
  userId?: number;
  coverLetterId: number;
  createdAt: string;
  updatedAt: string;
  email: string;
  fullName: string;
  image: string | null;
  onHold: boolean;
  organizationId: number;
  applicants: unknown;
  applicationForm: unknown;
}

interface OrgActiveMemberCardProps {
  activeUserId?: string | number | null;
  applicants?: ApplicantDataItem[];
  setSelectedUserId?: (value: string | number) => void;
  onActiveApplicantSelect?: (option: {
    label: string;
    value: string | number;
  }) => void;
}

const OrgActiveMemberCard = ({
  activeUserId,
  applicants = [],
  setSelectedUserId,
  onActiveApplicantSelect,
}: OrgActiveMemberCardProps) => {
  const dispatch = useAppDispatch();

  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const orgState: any = useAppSelector((store: RootStore) => {
    return store.OrgSlice;
  });
  const activeApplicant = useMemo(() => {
    if (activeUserId == null) {
      return undefined;
    }

    const normalizedActiveUserId = String(activeUserId);

    return applicants.find(({ id }) => String(id) === normalizedActiveUserId);
  }, [activeUserId, applicants]);

  useEffect(() => {
    if (!activeApplicant || !onActiveApplicantSelect) return;
    onActiveApplicantSelect({
      label: activeApplicant.fullName,
      value: activeApplicant.applicantId,
    });
  }, [activeApplicant, onActiveApplicantSelect]);

  const { fullName = "", email = "" } = activeApplicant ?? {};
  const initials = getInitials(fullName) || "NA";

  useEffect(() => {
    const handleIndividualSelectChanges = (option: any) => {
      chrome.storage.local.set({ selectedUser: option }, () => {});
      resumeList.individualApplicantData?.map((data: any, index: number) => {
        if (option.value === data.applicantId) {
          dispatch(setUserIndex(index));
          chrome.storage.local.set({ selectedUserIndex: index });
        }
      });
      const filteredArray = resumeList.individualApplicantData?.filter(
        (data: any) => {
          return option.value === data.applicantId;
        },
      );
      if (!filteredArray || filteredArray.length === 0) return;
      // setUserResumeList(filteredArray[0].applicants);
      setSelectedUserId(option.value);
      // setSelectedUserValue(option);
      dispatch(setResumeIndex(0));
      chrome.storage.local.set({ selectedResumeIndex: 0 });
    };
  }, [activeApplicant]);

  return (
    <div className="applicant-summary">
      <span className="avatar avatar--primary" aria-hidden="true">
        {initials}
      </span>

      <span className="applicant-copy">
        <strong>{fullName}</strong>
        {email && <small>{email}</small>}
      </span>
    </div>
  );
};

export default memo(OrgActiveMemberCard);
