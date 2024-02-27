export const getJobsFromIndeed = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setLocation,
  setSource,
  setCompanyName,
  setAddationalInfo
): void => {
  setPostUrl(window.location.href);

  setTimeout(() => {
    const titleElement = document?.querySelector(
      ".jobsearch-JobInfoHeader-title"
    );
    // Get the text content from the titleElement
    const text = titleElement?.textContent?.trim();
    // Extract "React.js Developer"
    const jobTitle = text?.split(" - ")[0];
    if (jobTitle) {
      setJobstitle(jobTitle);
    }
  }, 1000);

  const companyElement = document.querySelector(
    '[data-testid="inlineHeader-companyName"]'
  );

  if (companyElement) {
    setCompanyName(companyElement?.textContent.trim());
  }

  const locationEle = document
    .querySelector('[data-testid="inlineHeader-companyLocation"]')
    .textContent.trim();

  const locationText = locationEle.split("•")[0];
  setLocation(locationText) ?? "";

  const sallaryInfo =
    document.querySelector("#salaryInfoAndJobType").textContent.trim() ?? "";

  setAddationalInfo([locationEle, sallaryInfo]);

  const about = document.getElementById("jobDescriptionText");
  setJobDescription(about?.innerHTML);

  setSource("Indeed");
};
