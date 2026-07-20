import React from "react";
import { getInitials } from "./helper";

interface ApplicantDataItem {
  applicantId: number;
  userId?: number;
  coverLetterId: 1;
  createdAt: string;
  email: string;
  fullName: string;
  id: number;
  image: string | null;
  onHold: boolean;
  organizationId: number;
  updatedAt: string;
  applicants: any;
  applicationForm: any;
}

interface OrgActiveMemberCardProps {
  activeUserId?: string | number | null;
  applicants?: ApplicantDataItem[];
}

const isSameId = (left: unknown, right: unknown) =>
  left != null && right != null && String(left) === String(right);

const OrgActiveMemberCard = ({
  activeUserId,
  applicants = [],
}: OrgActiveMemberCardProps) => {
  const applicantMatch = applicants.find((item) =>
    isSameId(item.id, activeUserId),
  );

  const name = applicantMatch?.fullName ?? "";
  const email = applicantMatch?.email ?? "";

  return (
    <div className="applicant-summary">
      <span className="avatar avatar--primary">
        {getInitials(name) || "NA"}
      </span>
      <span className="applicant-copy">
        <strong>{name}</strong>
        <small>{email}</small>
      </span>
    </div>
  );
};

export default OrgActiveMemberCard;
