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
