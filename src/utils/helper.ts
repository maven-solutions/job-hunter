export const extractSalaryFromString = (jobInsightText: string) => {
  const regex =
    /\$\d+(?:,\d+)*(?:\.\d+)?(?:K|k)?\/(?:yr|hr|m)?(?:\s*-\s*\$\d+(?:,\d+)*(?:\.\d+)?(?:K|k)?\/(?:yr|hr|m)?)?/;
  const matches = jobInsightText.match(regex);
  if (matches) {
    const salary = matches[0];
    // Assuming you have a dispatch function and setSalary action creator function defined somewhere
    return salary;
  }
  return null; // Or whatever you want to return if there's no match
};

export const isEmptyArray = (array) => {
  if (!array || array.length === 0) {
    return true;
  }
  return false;
};
