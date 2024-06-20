import { Applicant } from "../data";
import { delay } from "../helper";

export const icims = async (tempDiv: any, applicantData: Applicant) => {
  const acceptButton = tempDiv.querySelector('[for="accept_gdpr"]');
  if (acceptButton) {
    acceptButton.click();
    await delay(1000);
  }

  const nextButton = tempDiv.querySelector(
    'input[id="enterEmailSubmitButton"]'
  );
  if (nextButton) {
    nextButton.click();
    await delay(1000);
  }
};
