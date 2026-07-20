import React, { memo, useMemo } from "react";
import { getInitials } from "./helper";

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
}

const OrgActiveMemberCard = ({
  activeUserId,
  applicants = [],
}: OrgActiveMemberCardProps) => {
  const activeApplicant = useMemo(() => {
    if (activeUserId == null) {
      return undefined;
    }

    const normalizedActiveUserId = String(activeUserId);

    return applicants.find(({ id }) => String(id) === normalizedActiveUserId);
  }, [activeUserId, applicants]);

  const { fullName = "", email = "" } = activeApplicant ?? {};
  const initials = getInitials(fullName) || "NA";

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
