import { extractDateFromDiceDom } from "../contentScript/helper";

export const getJobsFromDice = (
  setPostUrl,
  clearStateAndCity,
  setJobstitle,
  setJobDescription,
  isDateString,
  setPostedDate,
  setEasyApply,
  setJobType,
  setEmployment,
  setSource,
  setCompanyName,

  setJoboverview,
  setLocation
): void => {
  setPostUrl(window.location.href);
  clearStateAndCity();
  // Get the HTML element by its data-cy attribute
  const titleElement = document.querySelector('[data-cy="jobTitle"]');
  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    setJobstitle(title);
  }
  const companyNameEle = document.querySelector('[data-cy="companyNameLink"]');
  const companyNameWithNoLinkEle = document.querySelector(
    '[data-cy="companyNameNoLink"]'
  );
  if (companyNameEle) {
    // Get the text content from the element
    const companyName = companyNameEle?.textContent?.trim();
    setCompanyName(companyName);
  } else if (companyNameWithNoLinkEle) {
    const companyNameWithNoLink = companyNameWithNoLinkEle?.textContent?.trim();
    setCompanyName(companyNameWithNoLink);
  }

  // Get the HTML element by its data-testid attribute
  const locationElement = document.querySelector(
    ".job-header_jobDetail__ZGjiQ"
  );

  const locationText = document
    .querySelector('[data-cy="location"]')
    .textContent.trim();
  setLocation(locationText);

  const employmentDetailsText =
    document
      .querySelector('[data-cy="employmentDetails"]')
      ?.textContent?.trim() ?? "";

  const willingToSponsorText =
    document
      .querySelector('[data-cy="willingToSponsor"]')
      ?.textContent?.trim() ?? "";

  setJoboverview([employmentDetailsText, willingToSponsorText]);

  // Get the HTML element by its data-testid attribute
  const dateElement = document.querySelector("#timeAgo");
  const date = extractDateFromDiceDom(dateElement);
  setPostedDate(date);

  const jobDescriptionEle = document.querySelector(
    '[data-testid="jobDescriptionHtml"]'
  );
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }

  // const jobTypeText = document.querySelector('[data-cy="locationDetails"]');
  // if (jobTypeText) {
  //   // Get the text content from the element
  //   const jobType = jobTypeText?.textContent?.trim();
  //   if (
  //     jobType?.toLowerCase() === "remote" ||
  //     jobType?.toLowerCase() === "on site" ||
  //     jobType?.toLowerCase() === "hybrid"
  //   ) {
  //     setJobType(jobTypeText);
  //   } else {
  //     setJobType(null);
  //   }
  //   setJobType(jobType);
  // } else {
  //   setJobType(null);
  // }
  setEmployment(null);
  setJobType(null);
  setEasyApply(null);

  setSource("Dice");
};
