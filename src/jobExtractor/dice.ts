import { extractDateFromDiceDom } from "../contentScript/helper";

export const getJobsFromDice = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setLocation,
  setSource,
  setCompanyName,
  setAddationalInfo
): void => {
  setPostUrl(window.location.href);

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

  // Get the HTML element by its data-testid attribute
  const locationText = document
    .querySelector('[data-cy="location"]')
    .textContent.trim();

  setLocation(locationText);

  const jobDescriptionEle = document.querySelector(
    '[data-testid="jobDescriptionHtml"]'
  );
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }

  const jobTypeText =
    document.querySelector('[data-cy="locationDetails"]').textContent.trim() ??
    "";

  const payDetailText =
    document.querySelector('[data-cy="payDetails"]').textContent.trim() ?? "";

  const employmentDetailsText =
    document
      .querySelector('[data-cy="employmentDetails"]')
      .textContent.trim() ?? "";

  const willingToSponsorText =
    document.querySelector('[data-cy="willingToSponsor"]').textContent.trim() ??
    "";

  setAddationalInfo([
    jobTypeText,
    payDetailText,
    employmentDetailsText,
    willingToSponsorText,
  ]);
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

  setSource("Dice");
};