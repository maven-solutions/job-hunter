import {
  clearJobState,
  setJobCompany,
  setJobCompanyLogo,
  setJobCulture,
  setJobDesc,
  setJobFoundStatus,
  setJobLocation,
  setJobPostUrl,
  setJobRelatedInfo,
  setJobSource,
  setJobSummary,
  setJobTitle,
  setJobType,
  setSalary,
} from "../store/features/JobDetail/JobDetailSlice";

const getJobsFromZipRecuriter1 = (dispatch, zipDom: any) => {
  const zipDomForLink = document.querySelector(".job_result_selected");
  if (zipDomForLink) {
    const link = zipDomForLink.querySelector("a");
    dispatch(setJobPostUrl(link.href));
  }

  const titleEle = zipDom.querySelector("h1");
  const title = titleEle?.textContent?.trim();

  dispatch(setJobTitle(title));
  let companyEle = zipDom.querySelector("a");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    dispatch(setJobCompany(inputString));
  }
  const jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    dispatch(setJobDesc(description));
  }
};

function removeDynamicPart(url) {
  return url.replace(/=[^"]*$/, "");
}
const getJobsFromZipRecuriter2 = (dispatch, zipDom: any) => {
  const titleEle = zipDom.querySelector(".job_title");
  const title = titleEle?.textContent?.trim();
  dispatch(setJobTitle(title));

  const logoEle = zipDom.querySelector(".logo_img");
  dispatch(setJobCompanyLogo(logoEle.src));

  let companyEle = zipDom.querySelector(".hiring_company");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    dispatch(setJobCompany(inputString));
  }
  const locationtext =
    zipDom.querySelector(".hiring_location")?.textContent?.trim() ?? "";
  dispatch(setJobLocation(locationtext));

  const jobCharacterstics = zipDom.querySelector(".job_characteristics");
  let workType =
    jobCharacterstics.querySelector(".wfh_label")?.textContent?.trim() ?? "";
  if (!workType) {
    workType = "Onsite";
  }
  dispatch(setJobType(workType));
  const employmentType =
    jobCharacterstics
      .querySelector(".t_employment_type")
      ?.textContent?.trim() ?? "";
  const benefits =
    jobCharacterstics.querySelector(".t_benefits")?.textContent?.trim() ?? "";

  const compensation =
    jobCharacterstics.querySelector(".t_compensation")?.textContent?.trim() ??
    "";
  if (compensation) {
    dispatch(setSalary(compensation));
  }

  let elements: string[] = [];
  let elements2: string[] = [];

  if (workType) {
    elements.push(workType);
  }
  if (employmentType) {
    elements.push(employmentType);
    elements2.push(employmentType);
  }
  const firstEle = elements?.join(" • ");
  // employmentType;

  dispatch(setJobRelatedInfo(firstEle));

  dispatch(setJobCulture(elements2?.join(" • ") ?? ""));
  dispatch(setJobSummary([benefits]));

  const jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    dispatch(setJobDesc(description));
  }
};

const getJobsFromZipRecuriter3 = (dispatch, zipDom: any) => {
  const titleEle = zipDom.querySelector("a");
  const title = titleEle?.textContent?.trim() ?? "";
  dispatch(setJobTitle(title));

  let companyEle = zipDom.querySelector('[data-testid="job-card-company"]');
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    dispatch(setJobCompany(inputString));
  }

  const img = zipDom.querySelector("img");
  if (img) {
    const url = removeDynamicPart(img.src);
    if (url) {
      dispatch(setJobCompanyLogo(url));
    }
  }

  const location = zipDom.querySelector('[data-testid="job-card-location"]');
  if (location) {
    const address = location.textContent.trim();
    if (address) {
      dispatch(setJobLocation(address));
    }
  }

  // const jobDescriptionEle = zipDom.querySelector(
  //   ".relative.flex.flex-col.gap-24"
  // );
  // if (jobDescriptionEle) {
  //   const description = jobDescriptionEle?.innerHTML;
  //   // dispatch(setJobDesc(description));
  // }

  const parentElement = location.parentNode;
  const childNodes = parentElement.childNodes;

  // Iterate through the child nodes to find the text node after the anchor tag
  let remoteText = "";
  for (let i = 0; i < childNodes.length; i++) {
    if (childNodes[i] === location && i + 1 < childNodes.length) {
      // Get the text content of the next node and remove the "•" symbol
      remoteText = childNodes[i + 1].textContent.replace("•", "").trim();
      break;
    }
  }

  if (!remoteText) {
    remoteText = "Onsite";
  }

  dispatch(setJobType(remoteText));

  let flexEle = zipDom.querySelector('div[class="flex flex-col"]');
  const sallaryEle = flexEle?.querySelector(".flex.items-center");
  const sallary = sallaryEle?.textContent?.trim() ?? "";
  if (sallary) {
    dispatch(setSalary(sallary));
  }

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
  if (siblingPTags.length > 1) {
    const text = siblingPTags[1]?.textContent?.trim();

    if (text) {
      workCulturalInfo = text;
    }
  }

  let elements: string[] = [];

  if (remoteText) {
    elements.push(remoteText);
  }
  if (workCulturalInfo) {
    elements.push(workCulturalInfo);
  }
  let firstEle = elements.join(" • ");

  if (medicalInfo) {
    dispatch(setJobSummary([medicalInfo]));
  }
  dispatch(setJobRelatedInfo(firstEle));
  dispatch(setJobCulture(workCulturalInfo));

  const desc = document.querySelector(
    'div[class="relative flex flex-col gap-24"]'
  );
  if (desc) {
    const description = desc?.innerHTML;
    if (description) {
      dispatch(setJobDesc(description));
    }
  }
};

export const getJobFromZipRecruiter = (dispatch): void => {
  const zipDom = document.querySelector('[data-testid="right-pane"]');
  console.log("zipDom::", zipDom);

  const zipDom2 = document.querySelector(".job_details");
  console.log("zipDom2::", zipDom2);

  const zipDom3 = document.querySelector(
    ".job_result_wrapper.job_result_selected"
  );
  console.log("zipDom3::", zipDom3);

  if (zipDom) {
    getJobsFromZipRecuriter1(dispatch, zipDom);
  }
  if (zipDom2) {
    dispatch(setJobPostUrl(window.location.href));
    getJobsFromZipRecuriter2(dispatch, zipDom2);
  }
  if (zipDom3) {
    dispatch(setJobPostUrl(window.location.href));
    getJobsFromZipRecuriter3(dispatch, zipDom3);
  }

  dispatch(setJobSource("ZipRecruiter"));
  if (zipDom || zipDom2 || zipDom3) {
    dispatch(setJobFoundStatus(true));
  }
};
