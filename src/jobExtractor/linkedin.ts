const getAddationalInfo = (setAddationalInfo) => {
  let workplacetype: any = document
    .querySelector(".ui-label.ui-label--accent-3.text-body-small")
    .textContent.trim()
    .split(" ");
  workplacetype = workplacetype[workplacetype.length - 1];
  workplacetype = workplacetype.replace(".", " ");

  const jobInsightElement = document.querySelector(
    ".job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight"
  );
  // Get the text content
  const jobInsightText = jobInsightElement.textContent.trim();
  // Extract "worktype position"
  const positionText = jobInsightText.split(".").pop().trim();
  // Split "worktype position" to extract "worktype"
  const positionSplit = positionText.split(" ");
  const worktype = positionSplit.shift(); // Remove and return the first element of the array
  const position = positionSplit.join(" ");

  const secondLiElement = document?.querySelectorAll(
    ".job-details-jobs-unified-top-card__job-insight"
  )[1];
  const secondLiText = secondLiElement?.textContent?.trim() ?? "";

  const firstEle =
    `${workplacetype.trim()} . ${worktype.trim()} . ${position.trim()}` ?? "";

  setAddationalInfo([firstEle, secondLiText]);
};
export const getContentFromLinkedInJobs = (
  setPostUrl,
  setJobstitle,
  setJobDescription,
  setLocation,
  setSource,
  setCompanyName,
  setAddationalInfo
): void => {
  try {
    if (!document.querySelector(".jobs-search__job-details--wrapper")) {
      return;
    }

    setPostUrl(window.location.href);
    const jobsBody = document?.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      setJobstitle(jobsBody[0]?.textContent.trim());
    }

    setTimeout(() => {
      let jobDetailsElement = document?.getElementById("job-details");
      const about = jobDetailsElement?.querySelector("span");
      setJobDescription(about?.innerHTML);
    }, 500);

    // find posted date
    const locationText = document
      .querySelector(
        ".job-details-jobs-unified-top-card__primary-description-without-tagline"
      )
      .textContent.trim()
      .split("·")[1]
      .trim();
    if (locationText) {
      setLocation(locationText);
    }

    getAddationalInfo(setAddationalInfo);

    setSource("linkedin");
    // Assuming you have a reference to the DOM element
    setTimeout(() => {
      const domElement = document?.querySelector(".jobs-unified-top-card.t-14");
      const aTag = domElement?.querySelector("a.app-aware-link");
      const companyName = aTag?.textContent;
      setCompanyName(companyName?.trim());
    }, 500);
  } catch (error) {
    console.log(error);
  }
};
