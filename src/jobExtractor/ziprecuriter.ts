const getJobsFromZipRecuriter1 = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setLocation,
  setSource,
  setCompanyName,
  setAddationalInfo,
  zipDom: any
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
  const jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }
};
const getJobsFromZipRecuriter2 = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setLocation,
  setSource,
  setCompanyName,
  setAddationalInfo,
  zipDom: any
) => {
  const titleEle = zipDom.querySelector(".job_title");
  const title = titleEle?.textContent?.trim();
  setJobstitle(title);

  let companyEle = zipDom.querySelector(".hiring_company");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    setCompanyName(inputString);
  }
  const locationtext =
    zipDom.querySelector(".hiring_location")?.textContent?.trim() ?? "";
  setLocation(locationtext);

  const jobCharacterstics = zipDom.querySelector(".job_characteristics");
  const workType =
    jobCharacterstics.querySelector(".wfh_label")?.textContent?.trim() ?? "";
  const employmentType =
    jobCharacterstics
      .querySelector(".t_employment_type")
      ?.textContent?.trim() ?? "";
  const benefits =
    jobCharacterstics.querySelector(".t_benefits")?.textContent?.trim() ?? "";
  setAddationalInfo([workType, employmentType, benefits]);

  const compensation =
    jobCharacterstics.querySelector(".t_compensation")?.textContent?.trim() ??
    "";

  setAddationalInfo([workType, employmentType, benefits, compensation]);

  const jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    setJobDescription(description);
  }
};

export const getJobFromZipRecruiter = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setLocation,
  setSource,
  setCompanyName,
  setAddationalInfo
): void => {
  const zipDom = document.querySelector('[data-testid="right-pane"]');

  const zipDom2 = document.querySelector(".job_details");
  if (zipDom) {
    getJobsFromZipRecuriter1(
      setPostUrl,
      setJobstitle,
      setJobDescription,
      setLocation,
      setSource,
      setCompanyName,
      setAddationalInfo,
      zipDom
    );
  }
  if (zipDom2) {
    setPostUrl(window.location.href);

    getJobsFromZipRecuriter2(
      setPostUrl,
      setJobstitle,
      setJobDescription,
      setLocation,
      setSource,
      setCompanyName,
      setAddationalInfo,
      zipDom2
    );
  }

  setSource("Ziprecruiter");
};
