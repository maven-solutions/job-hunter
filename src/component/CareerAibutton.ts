const careerAiButton = (jobHeader, jobLink, website) => {
  const careerAiButton = document.createElement("a");

  // Set attributes and styles for the button
  careerAiButton.href = jobLink;
  careerAiButton.target = "_blank";
  careerAiButton.textContent = "Add This Job to CareerAi";

  if (website === "simplyhired") {
    careerAiButton.classList.add(
      "landingpage-careerai-button",
      "landingpage-careerai-button-simplyhired"
    );
  }
  if (website === "glassdoor") {
    careerAiButton.classList.add(
      "landingpage-careerai-button",
      "landingpage-careerai-button-glassdoor"
    );
  }

  jobHeader.prepend(careerAiButton);
};

export const addButtonToSimplyHired = () => {
  if (window.location.href !== "https://www.simplyhired.com/") {
    return;
  }
  try {
    //  data-testid="viewJobHeadingContainer"
    const jobHeader = document.querySelector(
      '[data-testid="viewJobHeadingContainer"]'
    );
    let jobLink = "";
    const JobEle = document.querySelector(".css-1rmyghn");
    if (JobEle) {
      const jobAnchor = JobEle?.querySelector("a");
      if (jobAnchor) {
        jobLink = jobAnchor?.getAttribute("href");
      }
    }

    // Remove previously appended buttons
    const existingButtons = jobHeader.querySelectorAll("a");
    existingButtons.forEach((button) => {
      button.remove();
    });

    careerAiButton(jobHeader, jobLink, "simplyhired");
  } catch (error) {}
};

// this button will be added on glassdoor website
export const addButtonToGlassdoorWebsite = () => {
  try {
    let jobLinkEle: any = "";
    let jobLink: any = "";
    const jobLinkEleSection = document.querySelector('[data-selected="true"]');
    if (jobLinkEleSection) {
      jobLinkEle = jobLinkEleSection?.querySelector("a");
    }
    if (jobLinkEle) {
      jobLink = jobLinkEle?.getAttribute("href");
    }

    const container = document.querySelector(
      '[data-test="job-details-header"]'
    );

    const jobHeader = container.children[0];
    // Remove previously appended buttons
    const existingButtons = container.querySelectorAll("a");
    existingButtons.forEach((button) => {
      button.remove();
    });
    careerAiButton(jobHeader, jobLink, "glassdoor");
  } catch (error) {
    console.log(error);
  }
};
