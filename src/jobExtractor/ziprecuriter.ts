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
  setJobDescription,
  setJoboverview,
  setLocation
) => {
  const titleEle = zipDom.querySelector(".job_title");
  const title = titleEle?.textContent?.trim();
  setJobstitle(title);

  let companyEle = zipDom.querySelector(".hiring_company");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    setCompanyName(inputString);
  }
  const jobCharacterstics = zipDom.querySelector(".job_characteristics");
  const benefits =
    jobCharacterstics.querySelector(".t_benefits")?.textContent?.trim() ?? "";
  setJoboverview([benefits]);

  const locationtext =
    zipDom.querySelector(".hiring_location")?.textContent?.trim() ?? "";
  setLocation(locationtext);
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
      setJobDescription,
      setJoboverview,
      setLocation
    );
  }

  const zipDom3 = document.querySelector(
    ".job_result_wrapper.job_result_selected"
  );
  if (zipDom3) {
    let flexEle = zipDom.querySelector('div[class="flex flex-col"]');

    let medicalInfo = "";
    let workCulturalInfo = "";
    const siblingPTags = flexEle.querySelectorAll(":scope > p");
    if (siblingPTags.length > 0) {
      const text = siblingPTags[0]?.textContent?.trim();
      if (
        ["time", "contract", "temporary"].some((type) =>
          text.toLowerCase().includes(type)
        )
      ) {
        workCulturalInfo = text;
      } else {
        medicalInfo = text;
      }
    }
    if (medicalInfo) {
      setJoboverview([medicalInfo]);
    }

    const location = zipDom.querySelector('[data-testid="job-card-location"]');
    if (location) {
      const address = location.textContent.trim();
      if (address) {
        setLocation(address);
      }
    }
  }

  setPostedDate("n/a");
  setEmployment(null);
  setJobType(null);
  setEasyApply(null);
  setSource("Ziprecruiter");
};
