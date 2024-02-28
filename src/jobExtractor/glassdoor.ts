const removeRatingFromEnd = (inputString) => {
  // Remove the rating at the end of the string
  let stringWithoutRating = inputString.replace(/\d+(\.\d+)?★$/, "");
  // Remove any trailing whitespace
  let finalString = stringWithoutRating.trim();
  return finalString;
};

export const getJobFromGlassdoor = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setPostedDate,
  setSource,
  setCompanyName,
  setEmployment,
  setJobType,
  setEasyApply
): void => {
  setPostUrl(window.location.href);

  const glassDom = document.querySelector('[data-test="job-details-header"]');

  // this is for the desing where there is tab section in that page
  const titleElement = glassDom.querySelector("h1");

  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    setJobstitle(title);
  }

  const companyNameEle = glassDom.querySelector("span");

  if (companyNameEle) {
    // Get the text content from the element
    const inputString = companyNameEle?.textContent?.trim();
    const companyName = removeRatingFromEnd(inputString);
    setCompanyName(companyName);
  }

  setEmployment(null);
  setJobType(null);
  setPostedDate("n/a");
  setEasyApply(null);

  const jobDescriptionEle = document.querySelector(".css-1vbe1p2");
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }

  // end of   desing where there is tab section in that page

  //  this is for where ther is no tabs in listing page

  const titleElement2 = document.querySelector(".JobDetails_jobTitle__Rw_gn");

  if (titleElement2) {
    // Get the text content from the element
    const title = titleElement2?.textContent?.trim();
    if (title) {
      setJobstitle(title);
    }
  }

  const companyNameEle2 = document.querySelector(
    ".EmployerProfile_employerName__8w0tV"
  );

  if (companyNameEle2) {
    // Get the text content from the element
    const companyName = companyNameEle2?.textContent?.trim();
    if (companyName) {
      setCompanyName(companyName);
    }
  }

  const jobDescriptionEle2 = document.querySelector(
    ".JobDetails_jobDescription__6VeBn"
  );
  if (jobDescriptionEle2) {
    // Get the text content from the element
    const description = jobDescriptionEle2?.innerHTML;
    setJobDescription(description);
  }

  setSource("Glassdoor");
};
