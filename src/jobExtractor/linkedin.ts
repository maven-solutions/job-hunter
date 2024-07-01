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
  //   dispatch(setCompanyDetails(companyDetails));
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
  //   dispatch(setRecruiterDetails(recruiterDetails));
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
  setCompanyName
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

    setTimeout(() => {
      let jobDetailsElement: any = document?.querySelector(
        ".jobs-description__container"
      );

      setJobDescription(jobDetailsElement?.innerHTML);
    }, 500);

    // find posted date

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
  } catch (error) {
    console.log(error);
  }
};
