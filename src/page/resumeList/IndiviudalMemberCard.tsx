import React, { memo, useEffect, useMemo } from "react";
import { getInitials } from "./helper";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  setResumeIndex,
  setUserIndex,
} from "../../store/features/ResumeList/ResumeListSlice";
import {
  getLocalStorageData,
  setLocalStorageData,
} from "../../autofill/helper";

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
  setUserResumeList?: (value: any) => void;
}

const IndiviudalMemberCard = ({
  activeUserId,
  applicants = [],
  setSelectedUserId,
  setUserResumeList,
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

  console.log("activeApplicant:::", activeApplicant);

  useEffect(() => {
    if (!activeApplicant) return;

    const syncActiveApplicant = async () => {
      setUserResumeList?.(activeApplicant.applicants);
      setSelectedUserId?.(activeApplicant.id);
      const resumeIndex = await getLocalStorageData("selectedResumeIndex");
      const userId = await getLocalStorageData("selectedUserId");

      console.log("resumeIndex::", resumeIndex);
      console.log("userId::", userId);

      if (userId !== activeApplicant.id) {
        dispatch(setResumeIndex(0));
        setLocalStorageData("selectedResumeIndex", 0);
        setLocalStorageData("selectedUserId", activeApplicant?.id);
      } else {
        dispatch(setResumeIndex(resumeIndex));
        setLocalStorageData("selectedResumeIndex", resumeIndex);
      }
    };

    syncActiveApplicant();
  }, [activeApplicant]);

  const { fullName = "", email = "" } = activeApplicant ?? {};
  const initials = getInitials(fullName) || "";

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

export default memo(IndiviudalMemberCard);
