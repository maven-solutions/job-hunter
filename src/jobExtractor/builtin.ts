export const getJobFromBuiltin = (
  dom: any,
  dom2: any,
  setPostUrl: any,
  setJobstitle: any,
  setCompanyName: any,
  setEmployment: any,
  setJobType: any,
  setPostedDate: any,
  setCity: any,
  setState: any,
  setEasyApply: any,
  setJobDescription: any,
  setSource: any
) => {
  setPostUrl(window.location.href);

  const titleElement = dom.querySelector(".field--name-title");
  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    setJobstitle(title);
  }

  const jobInfoEle = dom.querySelector(".job-info");
  if (jobInfoEle) {
    const companyNameEle = jobInfoEle.querySelector("a");
    if (companyNameEle) {
      // Get the text content from the element
      const inputString = companyNameEle?.textContent?.trim();
      setCompanyName(inputString);
    }
  } else {
    const companyNameEle = dom2.querySelector(".company-title");
    if (companyNameEle) {
      // Get the text content from the element
      const inputString = companyNameEle?.textContent?.trim();
      setCompanyName(inputString);
    }
  }

  setEmployment("n/a");
  setJobType(null);
  setPostedDate("n/a");
  setCity("n/a");
  setState("n/a");
  setEasyApply(0);

  const jobDescriptionEle = dom.querySelector(".job-description");
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }

  setSource("Builtin");
};
