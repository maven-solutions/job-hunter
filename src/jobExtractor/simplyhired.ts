export const getJobFromSimplyhired = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setLocation,
  setSource,
  setCompanyName,
  setAddationalInfo
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

  setLocation("n/a");

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
