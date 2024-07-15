const getJobsFromZipRecuriter1 = (
  zipDom: any,
  setPostUrl,
  setJobstitle,
  setCompanyName,
  setJobDescription
) => {
  const zipDomForLink = document.querySelector(".job_result_selected");
  if (zipDomForLink) {
    const link = zipDomForLink.querySelector("a");
    setPostUrl(link.href);
  }

  const titleEle = zipDom.querySelector("h1");
  const title = titleEle?.textContent?.trim();
  setJobstitle(title);
  let companyEle = zipDom.querySelector("a");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    setCompanyName(inputString);
  }
  let jobDescriptionEle: any = "";
  jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }

  jobDescriptionEle = document.querySelector(
    'div[class="relative flex flex-col gap-24"]'
  );
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    if (description) {
      setJobDescription(description);
    }
  }
};
const getJobsFromZipRecuriter2 = (
  zipDom: any,
  setJobstitle,
  setCompanyName,
  setJobDescription
) => {
  const titleEle = zipDom.querySelector(".job_title");
  const title = titleEle?.textContent?.trim();
  setJobstitle(title);

  let companyEle = zipDom.querySelector(".hiring_company");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    setCompanyName(inputString);
  }

  const jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }
};

export const getJobFromZipRecruiter = (
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
  clearStateAndCity();

  const zipDom = document.querySelector('[data-testid="right-pane"]');

  const zipDom2 = document.querySelector(".job_details");
  if (zipDom) {
    getJobsFromZipRecuriter1(
      zipDom,
      setPostUrl,
      setJobstitle,
      setCompanyName,
      setJobDescription
    );
  }
  if (zipDom2) {
    setPostUrl(window.location.href);
    getJobsFromZipRecuriter2(
      zipDom2,
      setJobstitle,
      setCompanyName,
      setJobDescription
    );
  }

  setPostedDate("n/a");
  setEmployment(null);
  setJobType(null);
  setEasyApply(null);
  setSource("Ziprecruiter");
};
