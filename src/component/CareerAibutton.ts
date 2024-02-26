const careerAiButton = (jobHeader, jobLink) => {
  const beautifulButton = document.createElement("a");

  // Set attributes and styles for the button
  beautifulButton.href = jobLink;
  beautifulButton.target = "_blank";
  beautifulButton.textContent = "Add This Job to CareerAi";
  beautifulButton.style.display = "inline-block";
  beautifulButton.style.padding = "7px 20px";
  beautifulButton.style.backgroundColor = "#0145FD";
  beautifulButton.style.color = "#ffffff";
  beautifulButton.style.textDecoration = "none";
  beautifulButton.style.borderRadius = "5px";
  beautifulButton.style.fontSize = "16px";
  beautifulButton.style.fontWeight = "500";
  beautifulButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
  beautifulButton.style.transition = "background-color 0.3s ease";
  jobHeader.prepend(beautifulButton);
};

export const addButtonToSimplyHired = () => {
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

    careerAiButton(jobHeader, jobLink);
  } catch (error) {}
};
