const removeRatingFromEnd = (inputString) => {
  // Remove the rating at the end of the string
  let stringWithoutRating = inputString.replace(/\d+(\.\d+)?★$/, "");
  // Remove any trailing whitespace
  let finalString = stringWithoutRating.trim();
  return finalString;
};

const getJobId = () => {
  // Given URL
  const url = window.location.href;

  // Regular expression pattern to match the job listing ID
  const regex = /jl=(\d+)/;
  // Use regex to extract the job listing ID
  const match = url.match(regex);
  if (match && match[1]) {
    const jobListingID = match[1];
    return jobListingID;
  } else {
    console.log("Job Listing ID not found in the URL.");
    return null;
  }
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
  const jobId = getJobId();
  const glassDom = document.querySelector('[data-test="job-details-header"]');

  // this is for the desing where there is tab section in that page
  const titleElement = glassDom.querySelector("h1");

  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    setJobstitle(title);
  }

  const companyNameEle = glassDom.querySelector('[aria-live="polite"]');

  if (companyNameEle) {
    // Get the text content from the element
    const inputString = companyNameEle?.textContent?.trim();
    const companyName = removeRatingFromEnd(inputString);
    setCompanyName(companyName);
  }
  const descSibling = document.querySelector(`#job-viewed-waypoint-${jobId}`);
  const descParent: any = descSibling?.nextSibling?.childNodes[0];
  const desc = descParent?.innerHTML ?? "";
  if (desc) {
    setJobDescription(desc);
  }

  setEmployment(null);
  setJobType(null);
  setPostedDate("n/a");
  setEasyApply(null);

  // for description
  //   const descParent = document.querySelectorAll("section")[1];
  //   const descInnperParent = descParent.children[1];
  // const desc

  // const sibling = glassDom.nextElementSibling;
  // if (sibling) {
  //   const descDom = sibling.nextElementSibling;
  //   if (descDom) {
  //     const desc = descDom.children[0];
  //     if (desc) {
  //       const innderDesc = desc.children[0];
  //       // Get the text content from the element
  //       const description = innderDesc?.innerHTML;
  //       setJobDescription(description);
  //     }
  //   }
  // }
  // end of   desing where there is tab section in that page

  //  this is for where ther is no tabs in listing page

  // const titleElement2 = document.querySelector(".JobDetails_jobTitle__Rw_gn");

  // if (titleElement2) {
  //   // Get the text content from the element
  //   const title = titleElement2?.textContent?.trim();
  //   if (title) {
  //     setJobstitle(title);
  //   }
  // }

  // const companyNameEle2 = document.querySelector(
  //   ".EmployerProfile_employerName__8w0tV"
  // );

  // if (companyNameEle2) {
  //   // Get the text content from the element
  //   const companyName = companyNameEle2?.textContent?.trim();
  //   if (companyName) {
  //     setCompanyName(companyName);
  //   }
  // }

  // const jobDescriptionEle2 = document.querySelector(
  //   ".JobDetails_jobDescription__6VeBn"
  // );
  // if (jobDescriptionEle2) {
  //   // Get the text content from the element
  //   const description = jobDescriptionEle2?.innerHTML;
  //   setJobDescription(description);
  // }

  setSource("Glassdoor");
};
