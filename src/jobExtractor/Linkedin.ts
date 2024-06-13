import { useEffect } from "react";
import { useAppDispatch } from "../store/store";
import {
  clearJobState,
  setCompanyDetails,
  setIsEasyApply,
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
  setRecruiterDetails,
  setSalary,
} from "../store/features/JobDetail/JobDetailSlice";
import { extractSalaryFromString } from "../utils/helper";
import { fromatStirngInLowerCase } from "../autofill/helper";

interface CompanyDetails {
  name?: string | null;
  logo?: string | null;
  summary?: string | null;
  link?: string | null;
  description?: string | null;
}
interface RecruiterDetails {
  name?: string | null;
  profileImage?: string | null;
  link?: string | null;
  title?: string | null;
  description?: string | null;
}

const getAddationalInfo = (dispatch) => {
  const jobInsightElement = document.querySelector(
    ".job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight"
  );
  const jobInsightText =
    jobInsightElement?.querySelector("span")?.textContent?.trim() ?? "";

  let workplacetype: string | null = null;
  let worktype: string | null = null;
  let position: string | null = null;
  let salary: string | null = null;

  // const matches = jobInsightText.match(regex);
  const matches = extractSalaryFromString(jobInsightText);
  if (matches) {
    salary = matches;
    dispatch(setSalary(matches));
  }
  // for workplace
  // console.log("jobInsightText::", jobInsightText);
  if (jobInsightText.toLocaleLowerCase().includes("remote")) {
    workplacetype = "Remote";
  } else if (jobInsightText.toLocaleLowerCase().includes("hybrid")) {
    workplacetype = "Hybrid";
  } else if (jobInsightText.toLocaleLowerCase().includes("on-site")) {
    workplacetype = "Onsite";
  }

  // for jobtype
  if (jobInsightText.toLocaleLowerCase().includes("full-time")) {
    worktype = "Full-time";
  } else if (jobInsightText.toLocaleLowerCase().includes("part-time")) {
    worktype = "Part-time";
  } else if (jobInsightText.toLocaleLowerCase().includes("contract")) {
    worktype = "Contract";
  } else if (jobInsightText.toLocaleLowerCase().includes("temporary")) {
    worktype = "Temporary";
  } else if (jobInsightText.toLocaleLowerCase().includes("volunteer")) {
    worktype = "Volunteer";
  } else if (jobInsightText.toLocaleLowerCase().includes("internship")) {
    worktype = "Internship";
  } else if (jobInsightText.toLocaleLowerCase().includes("other")) {
    worktype = "Other";
  }
  // for experience

  if (jobInsightText.toLocaleLowerCase().includes("internship")) {
    position = "Internship";
  } else if (jobInsightText.toLocaleLowerCase().includes("entry level")) {
    position = "Entry level";
  } else if (jobInsightText.toLocaleLowerCase().includes("associate")) {
    position = "Associate";
  } else if (jobInsightText.toLocaleLowerCase().includes("mid-senior")) {
    position = "Mid-Senior level";
  } else if (jobInsightText.toLocaleLowerCase().includes("director")) {
    position = "Director";
  } else if (jobInsightText.toLocaleLowerCase().includes("executive")) {
    position = "Executive";
  }

  let elements: string[] = [];
  let elements2: string[] = [];

  if (workplacetype) {
    elements.push(workplacetype);
  }
  if (worktype) {
    elements.push(worktype);
    elements2.push(worktype);
  }
  if (position) {
    elements.push(position);
    elements2.push(position);
  }

  let firstEle = elements.join(" • ");
  let jobCulture = elements2.join(" • ");
  const secondLiElement = document?.querySelectorAll(
    ".job-details-jobs-unified-top-card__job-insight"
  )[1];
  const secondLiText = secondLiElement?.textContent?.trim() ?? "";

  let imgEle: any = document.querySelector(
    // ".jobs-search-results-list__list-item--active-v2"
    ".jobs-search-results-list__list-item--active"
  );
  if (imgEle) {
    const img = imgEle?.querySelector("img");
    if (img) {
      dispatch(setJobCompanyLogo(img?.src));
    }
    const companyname = imgEle.querySelectorAll("span");
    const companyele = companyname[2];
    if (companyele) {
      dispatch(setJobCompany(companyele?.textContent?.trim()));
    }
  }

  dispatch(setJobCulture(jobCulture));
  dispatch(setJobType(workplacetype));
  dispatch(setJobRelatedInfo(firstEle));
  dispatch(setJobSummary([secondLiText]));
  dispatch(setJobFoundStatus(true));
};

function sanitizeHtml(description: string): string {
  // Remove all tags except <br> and replace with empty string
  const sanitizedHtml = description.replace(/<(?!br\s*\/?)[^>]+>/gi, "");

  // Remove specific words and patterns
  const cleanedHtml = sanitizedHtml
    .replace(/…/g, "") // Remove ellipsis (...)
    .replace(/\bshow more\b/gi, ""); // Remove "show more" (case insensitive whole word)

  // Remove trailing whitespace and specific test pattern
  const finalHtml = cleanedHtml.trim().replace(/<!---->\s*/g, "");

  return finalHtml;
}

const getCompanyDetails = (dispatch) => {
  const companyDetails: CompanyDetails = {};

  const companyDetailsEle =
    document.querySelector<HTMLElement>(".jobs-company__box");
  if (!companyDetailsEle) {
    return;
  }

  // Get company logo
  const logo = companyDetailsEle.querySelector<HTMLImageElement>("img")?.src;
  if (logo) {
    companyDetails.logo = logo;
  }

  // Get company name and link
  const atag = companyDetailsEle.querySelector<HTMLAnchorElement>(
    ".artdeco-entity-lockup__content a"
  );
  if (atag?.textContent) {
    companyDetails.name = atag.textContent.trim();
  }
  if (atag?.href) {
    companyDetails.link = `https://www.linkedin.com${atag.getAttribute(
      "href"
    )}`;
  }

  // Get company summary
  const summarySection =
    companyDetailsEle.querySelector<HTMLElement>(".t-14.mt5");
  if (summarySection?.textContent) {
    const formattedSummary = summarySection.textContent
      .split("\n")
      .map((part) => part.trim())
      .filter((part) => part !== "")
      .join(" • ");
    companyDetails.summary = formattedSummary;
  }

  // Get company description
  const desc = companyDetailsEle.querySelector<HTMLElement>(
    ".jobs-company__company-description > *:first-child"
  );
  if (desc?.innerHTML) {
    const sanitizedDescription = sanitizeHtml(desc.innerHTML);
    if (sanitizedDescription) {
      companyDetails.description = sanitizedDescription;
    }
  }
  dispatch(setCompanyDetails(companyDetails));
};

const getHiringTeamDetails = (dispatch) => {
  let recruiterDetails: RecruiterDetails = {};

  const hiringSectionEle = document.querySelector(
    ".hirer-card__hirer-information"
  );

  if (!hiringSectionEle) {
    return;
  }

  const nameTag = hiringSectionEle.querySelector<HTMLElement>(
    ".jobs-poster__name strong"
  );
  if (nameTag?.textContent) {
    recruiterDetails.name = nameTag.textContent.trim();
  }

  const prfileLink = hiringSectionEle.querySelector<HTMLAnchorElement>("a");
  if (prfileLink?.href) {
    recruiterDetails.link = prfileLink.href;
  }

  const profilesection = hiringSectionEle.previousElementSibling;
  const prfileImage = profilesection.querySelector<HTMLImageElement>("img");
  if (prfileImage?.src) {
    recruiterDetails.profileImage = prfileImage?.src;
  }

  const detailsEle = hiringSectionEle.querySelector<HTMLElement>(
    ".hirer-card__hirer-information .text-body-small"
  );
  if (detailsEle?.textContent) {
    recruiterDetails.title = detailsEle.textContent.trim();
  }
  dispatch(setRecruiterDetails(recruiterDetails));
};
export const getContentFromLinkedInJobs = (dispatch): void => {
  try {
    if (!document.querySelector(".jobs-search__job-details--wrapper")) {
      return;
    }

    dispatch(setJobPostUrl(window.location.href));
    const jobsBody = document?.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      dispatch(setJobTitle(jobsBody[0]?.textContent.trim()));
    }

    // setTimeout(() => {
    //   let jobDetailsElement: any = document?.querySelector(
    //     ".jobs-description__container"
    //   );
    //   dispatch(setJobDesc(jobDetailsElement?.innerHTML));
    // }, 500);

    let jobDetailsElement: any = document?.querySelector(
      ".jobs-description__container"
    );
    dispatch(setJobDesc(jobDetailsElement?.innerHTML));

    // find posted date
    const locationText = document
      .querySelector(
        ".job-details-jobs-unified-top-card__primary-description-without-tagline "
      )
      ?.textContent?.trim()
      ?.split("·")[1]
      .trim();
    if (locationText) {
      dispatch(setJobLocation(locationText));
    }

    const location2 = document.querySelector(
      ".job-details-jobs-unified-top-card__tertiary-description"
    );
    const locationtext2: any = location2?.childNodes[1] ?? "";
    if (locationtext2?.textContent?.trim()) {
      dispatch(setJobLocation(locationtext2?.textContent?.trim()));
    }

    const loaction3Parent = document.querySelector(
      ".job-details-jobs-unified-top-card__primary-description-container"
    );

    if (loaction3Parent) {
      const allList = loaction3Parent.querySelectorAll(".tvm__text");
      if (allList && allList.length > 0) {
        const location = allList[0];
        dispatch(setJobLocation(location?.textContent?.trim()));
      }
    }
    getAddationalInfo(dispatch);
    dispatch(setJobSource("Linkedin"));

    // Assuming you have a reference to the DOM element
    // setTimeout(() => {
    //   const domElement = document?.querySelector(
    //     ".job-details-jobs-unified-top-card__primary-description-without-tagline"
    //   );
    //   const aTag = domElement?.querySelector("a.app-aware-link");
    //   const companyName = aTag?.textContent;
    //   if (companyName?.trim()) {
    //     dispatch(setJobCompany(companyName?.trim()));
    //   }
    // }, 500);

    const company2 = document.querySelector(
      ".job-details-jobs-unified-top-card__company-name"
    );

    const aTag2 = company2?.querySelector("a.app-aware-link");

    const companyName2 = aTag2?.textContent;
    if (companyName2?.trim()) {
      dispatch(setJobCompany(companyName2?.trim()));
    }
    const imgLogo: any = document?.querySelector(
      ".ivm-view-attr__img--centered.EntityPhoto-square-0"
    );
    if (imgLogo) {
      dispatch(setJobCompanyLogo(imgLogo?.src));
    }

    // handling refresh situation
    const comele = document.querySelector(
      ".job-details-jobs-unified-top-card__primary-description-without-tagline"
    );
    if (comele) {
      const atagele = comele.querySelector("a");

      if (atagele) {
        dispatch(setJobCompany(atagele.textContent?.trim()));
      }
    }

    // for easy apply
    const easyApplyCard = document.querySelector(
      ".jobs-apply-button--top-card"
    );
    if (easyApplyCard) {
      const button = easyApplyCard.querySelector("button");
      if (button) {
        const text = fromatStirngInLowerCase(button.textContent);
        if (text === "easyapply") {
          dispatch(setIsEasyApply(true));
        }
      }
    }

    // for comany details---
    getCompanyDetails(dispatch);
    getHiringTeamDetails(dispatch);
    // job - details - jobs - unified - top - card__company - name;
  } catch (error) {
    console.log(error);
  }
};
