export const getJobFromSimplyhired = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setPostedDate,
  setEasyApply,
  setJobType,
  setEmployment,
  setSource,
  setCompanyName,
  setCity,
  setState,
  setJoboverview,
  setLocation
): void => {
  setPostUrl(window.location.href);
  // this is for the desing where there is tab section in that page
  const titleElement = document.querySelector('[data-testid="viewJobTitle"]');

  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    setJobstitle(title);
  }

  const companyNameEle = document.querySelector(
    // '[data-test="employer-name"]'
    '[data-testid="detailText"]'
  );

  if (companyNameEle) {
    // Get the text content from the element
    const inputString = companyNameEle?.textContent?.trim();
    setCompanyName(inputString);
  }
  const locationText =
    document
      .querySelector('[data-testid="viewJobCompanyLocation"]')
      ?.textContent?.trim() ?? "";
  setLocation(locationText);
  setEmployment(null);
  setJobType(null);
  setPostedDate("n/a");
  setCity("n/a");
  setState("n/a");
  setEasyApply(null);

  const jobDescriptionEle = document.querySelector(
    '[data-testid="viewJobBodyJobFullDescriptionContent"]'
  );
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }

  setSource("Simplyhired");
};
