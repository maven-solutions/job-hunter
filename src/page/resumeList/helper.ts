export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export const isAdult = (dateOfBirth: string): boolean => {
  if (!dateOfBirth) {
    return false;
  }
  const dob: Date = new Date(dateOfBirth);
  const today: Date = new Date();
  const age: number = today.getFullYear() - dob.getFullYear();
  const monthDiff: number = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

export const generatePassword = (id) => {
  const pwd = `P@$$word80${id}`;
  return pwd;
};

export function getHighestEducation(education) {
  // Check if the education array is empty or undefined
  if (!Array.isArray(education) || education.length === 0) {
    return null; // Return null if no education data is available
  }

  let highestDegree = null;

  // Iterate through the education array to find the highest education level
  for (let i = 0; i < education.length; i++) {
    const degree = education[i]?.degree?.toLowerCase() || "";

    // Skip the entry if degree is empty or null
    if (!degree) {
      continue;
    }

    // Check for highest degrees
    if (degree.includes("doctorate")) {
      highestDegree = "doctorate";
      break; // Stop searching if a Doctorate is found
    } else if (
      degree.includes("master") &&
      (!highestDegree ||
        highestDegree === "bachelor" ||
        highestDegree === "diploma")
    ) {
      highestDegree = "master"; // Set Master's if no Doctorate is found
    } else if (
      degree.includes("bachelor") &&
      (!highestDegree || highestDegree === "diploma")
    ) {
      highestDegree = "bachelor"; // Set Bachelor's if no Master or Doctorate is found
    } else if (degree.includes("diploma") && !highestDegree) {
      highestDegree = "diploma"; // Set Diploma if no higher degree is found
    }
  }

  return highestDegree;
}
// Example cases to test

type UserListItem = { label: string; value: number };
type ApplicantItem = { id: number; fullName?: string; [key: string]: any };

export const getUserDetailsById = (
  id: number | string | null,
  applicantMode: "va" | "individual",
  resumeList: {
    individualApplicantData?: ApplicantItem[];
    applicantData?: ApplicantItem[];
  },
) => {
  const pool =
    applicantMode === "individual"
      ? resumeList.individualApplicantData
      : resumeList.applicantData;
  const filteredArray = pool?.filter((data) => id === data.id);
  if (!filteredArray || filteredArray.length === 0) return null;
  return filteredArray[0];
};

export const getSessionUserName = (
  userId: number | undefined | null,
  resumeList: {
    individualUserList?: UserListItem[];
    userList?: UserListItem[];
  },
): string => {
  if (userId == null) return "";
  const match =
    resumeList.individualUserList?.find(
      (user) => user.value === userId,
    ) ??
    resumeList.userList?.find((user) => user.value === userId);
  return match?.label ?? "";
};

export const getOrgSessionUserName = (
  userId: number | undefined | null,
  resumeList: {
    applicantData?: ApplicantItem[];
  },
): string => {
  if (userId == null) return "";
  const match = resumeList.applicantData?.find((user) => user.id === userId);
  return match?.fullName ?? "";
};
