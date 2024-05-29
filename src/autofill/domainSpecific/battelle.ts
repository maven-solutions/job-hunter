import { Applicant } from "../data";
import { fromatStirngInLowerCase } from "../helper";

const fillCitizen = (applicantData: Applicant) => {
  const select: any = document.querySelector("#citizen");
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) === "yes" &&
      (applicantData.us_work_authoriztaion ||
        applicantData.canada_work_authoriztaion)
    ) {
      option.selected = true;
      select.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("input", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("focus", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("click", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("blur", { bubbles: true, cancelable: false })
      );
      select.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      return true;
    }

    if (
      fromatStirngInLowerCase(option?.text) === "no" &&
      !applicantData.us_work_authoriztaion
    ) {
      option.selected = true;
      select.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("input", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("focus", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("click", { bubbles: true, cancelable: false })
      );
      select.dispatchEvent(
        new Event("blur", { bubbles: true, cancelable: false })
      );
      select.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      return true;
    }
  });
};

const fillSignatureDate = () => {
  const input: any = document.querySelector("#candidateSignDate");
  const today = new Date()?.toISOString()?.split("T")[0];
  if (!input || !today) {
    return;
  }

  input.value = today;
  input.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false })
  );
  input.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
  input.dispatchEvent(new Event("focus", { bubbles: true, cancelable: false }));
  input.dispatchEvent(new Event("click", { bubbles: true, cancelable: false }));
  input.dispatchEvent(new Event("blur", { bubbles: true, cancelable: false }));
};
export const battelle = async (tempDiv: any, applicantData: Applicant) => {
  fillCitizen(applicantData);
  fillSignatureDate();
};
