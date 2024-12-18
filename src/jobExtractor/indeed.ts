function removeJobPostSuffix(sentence: string): string {
  return sentence.replace(/- job post/gi, "").trim();
}

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

  const containerChrome = document.querySelector(".jobsearch-HeaderContainer");
  if (containerChrome) {
    // setTimeout(() => {
    const titleElement = document?.querySelector(
      'h2[data-testid="simpler-jobTitle"]'
    );
    // Get the text content from the titleElement
    const text = titleElement?.textContent?.trim();
    if (text) {
      setJobstitle(text);
    }
    // }, 1000);

    const companyElement = document.querySelector(
      ".jobsearch-JobInfoHeader-companyNameLink"
    );

    if (companyElement) {
      setCompanyName(companyElement?.textContent.trim());
    }
    if (!companyElement) {
      const companyEle = document.querySelector(
        ".jobsearch-JobInfoHeader-companyNameSimple"
      );
      console.log("companyEle::", companyEle);

      if (companyEle) {
        setCompanyName(companyEle?.textContent.trim());
      }
    }
  }

  const containerEdge = document.querySelector(
    ".jobsearch-InfoHeaderContainer"
  );
  if (containerEdge) {
    const titleEle = document.querySelector(
      '[data-testid="jobsearch-JobInfoHeader-title"]'
    );
    if (titleEle) {
      const text = titleEle?.textContent?.trim();
      const result = removeJobPostSuffix(text);
      setJobstitle(result ?? "");
    }

    const companyEle = document.querySelector(
      '[data-testid="inlineHeader-companyName"]'
    );
    if (companyEle) {
      setCompanyName(companyEle?.textContent?.trim() ?? "");
    }
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
