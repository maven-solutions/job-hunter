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
const getCompanyDetails = (setCompanyDetails) => {
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
  setCompanyDetails(companyDetails);
};

const getHiringTeamDetails = (setRecruiterDetails) => {
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
  setRecruiterDetails(recruiterDetails);
};

export const getContentFromLinkedInJobs = (
  setPostUrl,
  clearStateAndCity,
  setJobstitle,
  setJobDescription,
  isDateString,
  setPostedDate,
  setEasyApply,
  setJobType,
  setEmployment,
  setSource,
  setCompanyName,
  setCompanyDetails,
  setRecruiterDetails,
  setJoboverview,
  setLocation
): void => {
  try {
    setPostUrl(window.location.href);
    clearStateAndCity();

    const jobsBody = document?.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      setJobstitle(jobsBody[0]?.textContent.trim());
    }

    const secondLiElement = document?.querySelectorAll(
      ".job-details-jobs-unified-top-card__job-insight"
    )[1];
    const secondLiText = secondLiElement?.textContent?.trim() ?? "";

    setJoboverview([secondLiText]);

    setTimeout(() => {
      let jobDetailsElement: any = document?.querySelector(
        ".jobs-description__container"
      );

      setJobDescription(jobDetailsElement?.innerHTML);
    }, 500);

    // find posted date
    //location
    const locationText = document
      .querySelector(
        ".job-details-jobs-unified-top-card__primary-description-without-tagline "
      )
      ?.textContent?.trim()
      ?.split("·")[1]
      .trim();
    if (locationText) {
      setLocation(locationText);
    }

    const location2 = document.querySelector(
      ".job-details-jobs-unified-top-card__tertiary-description"
    );
    const locationtext2: any = location2?.childNodes[1] ?? "";
    if (locationtext2?.textContent?.trim()) {
      setLocation(locationtext2?.textContent?.trim());
    }

    const loaction3Parent = document.querySelector(
      ".job-details-jobs-unified-top-card__primary-description-container"
    );

    if (loaction3Parent) {
      const allList = loaction3Parent.querySelectorAll(".tvm__text");
      if (allList && allList.length > 0) {
        const location = allList[0];
        setLocation(location?.textContent?.trim());
      }
    }

    // location end here

    const daysAgoEle = document?.querySelector("#job-details");
    const targetElement = document.querySelector("#job-details");
    let date = [];
    // Check if the element is found
    if (targetElement) {
      // Get the next sibling element
      const nextElement = targetElement.nextElementSibling;

      // Check if the next sibling exists
      if (nextElement) {
        const modifiedDate = nextElement.innerHTML
          .replace("Posted on ", "")
          .replace(".", "");
        if (isDateString(modifiedDate)) {
          setPostedDate(modifiedDate);
        } else {
          setPostedDate("n/a");
        }
      }
    } else {
      setPostedDate("n/a");
    }

    setEasyApply(null);
    setJobType(null);
    setEmployment(null);

    setSource("linkedin");

    // Assuming you have a reference to the DOM element
    setTimeout(() => {
      const companyNameEle = document.querySelector(
        ".job-details-jobs-unified-top-card__company-name"
      );
      const companyName = companyNameEle.textContent.trim();
      setCompanyName(companyName);
    }, 500);
    // for comany details---
    setCompanyDetails({});
    setRecruiterDetails({});
    getCompanyDetails(setCompanyDetails);
    getHiringTeamDetails(setRecruiterDetails);
  } catch (error) {
    console.log(error);
  }
};
