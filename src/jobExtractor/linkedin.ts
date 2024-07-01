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
