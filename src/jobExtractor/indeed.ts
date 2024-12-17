export const getJobsFromIndeed = (
  setPostUrl,
  clearStateAndCity,
  setJobstitle,
  setJobDescription,
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

  setTimeout(() => {
    const titleElement = document?.querySelector(
      'h2[data-testid="simpler-jobTitle"]'
    );

    // Get the text content from the titleElement
    const text = titleElement?.textContent?.trim();

    if (text) {
      setJobstitle(text);
    }
  }, 1000);

  const companyElement = document.querySelector(
    ".jobsearch-JobInfoHeader-companyNameLink"
  );
  console.log("companyElement::", companyElement);

  if (companyElement) {
    setCompanyName(companyElement?.textContent.trim());
  }

  const locationEle = document
    .querySelector('[data-testid="inlineHeader-companyLocation"]')
    ?.textContent?.trim();
  if (locationEle) {
    let locationText = locationEle.split("•")[0] ?? "";
    setLocation(locationText);
  }

  const about = document.getElementById("jobDescriptionText");
  setJobDescription(about?.innerHTML);

  setJobType(null);
  setEmployment(null);
  setPostedDate("n/a");
  setEasyApply(null);
  setSource("Indeed");
};
