import { fieldNames } from "../FromFiller/fieldsname";
import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const fillAllRadioType = async (applicantData: Applicant) => {
  const allFieldset = document.querySelectorAll("fieldset");
  if (!allFieldset || allFieldset.length === 0) {
    return;
  }
  for (const fieldset of allFieldset) {
    const legend = fieldset.querySelector("legend");
    if (!legend) {
      return;
    }

    // for gender
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("gender")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            fromatStirngInLowerCase(label?.textContent) ===
            fromatStirngInLowerCase(applicantData.gender)
          ) {
            label.click();
          }
        }
      }
    }

    // for sponshership
    if (
      fromatStirngInLowerCase(legend?.textContent)?.includes("sponsorship") ||
      fromatStirngInLowerCase(legend?.textContent)?.includes("visa")
    ) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(label?.textContent)?.includes("yes")
          ) {
            label.click();
          }
          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(label?.textContent)?.includes("no")
          ) {
            label.click();
          }
        }
      }
    }

    // for hispanic
    if (
      fromatStirngInLowerCase(legend?.textContent)?.includes("hispanicorlatino")
    ) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            applicantData.hispanic_or_latino &&
            fromatStirngInLowerCase(label?.textContent) === "yes"
          ) {
            label.click();
          }
          if (
            !applicantData.hispanic_or_latino &&
            fromatStirngInLowerCase(label?.textContent) === "no"
          ) {
            label.click();
          }
        }
      }
    }
    // race
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("race")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase(applicantData.race)
            )
          ) {
            label.click();
          }
        }
      }
    }

    // for disability
    if (
      fromatStirngInLowerCase(legend?.textContent)?.includes("disability") ||
      fromatStirngInLowerCase(legend?.textContent)?.includes("pleasecheckone")
    ) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            applicantData.disability_status &&
            fromatStirngInLowerCase(label?.textContent)?.includes(
              "Yes, I have a disability"
            )
          ) {
            label.click();
          }
          if (
            !applicantData.disability_status &&
            fromatStirngInLowerCase(label?.textContent)?.includes(
              "No, I do not have a disability"
            )
          ) {
            label.click();
          }
        }
      }
    }

    // VETERANS
    if (
      fromatStirngInLowerCase(legend?.textContent)?.includes("veterans") ||
      fromatStirngInLowerCase(legend?.textContent)?.includes("chooseone")
    ) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            (applicantData.veteran_status === 1 ||
              applicantData.veteran_status === 3 ||
              applicantData.veteran_status === 4) &&
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase("I IDENTIFY AS ONE")
            )
          ) {
            label.click();
          }

          //----
          if (
            applicantData.veteran_status === 2 &&
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase("I AM NOT A")
            )
          ) {
            label.click();
          }

          // -----
          if (
            applicantData.veteran_status === 5 &&
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase("DECLINE")
            )
          ) {
            label.click();
          }
        }
      }
    }
  }
};

const fillSelect = async (tempDiv, applicantData: Applicant) => {
  const selectInputFields = document.querySelectorAll("select");
  if (!selectInputFields || selectInputFields.length === 0) {
    return;
  }
  let veteran = false;

  for (const select of selectInputFields) {
    const selectid = select.getAttribute("id");
    const labelElement = tempDiv.querySelector(`[for="${selectid}"]`);

    const labelText = labelElement?.textContent?.trim();
    const attributes: any = Array.from(select.attributes);
    attributes.some((attribute) => {
      // for work authorization
      if (checkIfExist(labelText, ["legally"])) {
        Array.from(select.options).find((option: any) => {
          if (fromatStirngInLowerCase(option?.text)?.includes("yes")) {
            option.selected = true;
            handleValueChanges(option);
            return;
          }
        });
      }
      // for disability
      if (
        checkIfExist(labelText, fieldNames.disability_status) ||
        checkIfExist(attribute.value, fieldNames.disability_status)
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text)?.includes("yes") &&
            applicantData.disability_status
          ) {
            option.selected = true;
            handleValueChanges(option);
            return;
          }

          if (
            fromatStirngInLowerCase(option?.text)?.includes("no") &&
            !applicantData.disability_status
          ) {
            option.selected = true;
            handleValueChanges(option);
            return;
          }
        });
      }

      // for veteran
      if (
        checkIfExist(labelText, fieldNames.veteran) ||
        checkIfExist(attribute.value, fieldNames.veteran)
      ) {
        Array.from(select.options).find((option: any) => {
          //for yes
          if (
            applicantData.veteran_status === 1 &&
            // !veteran &&
            (fromatStirngInLowerCase(option?.text)?.includes("veteran") ||
              fromatStirngInLowerCase(option?.text)?.includes("veteran"))
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          if (
            applicantData.veteran_status === 2 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text)?.includes("nota")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          // for yes
          if (
            applicantData.veteran_status === 3 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text)?.includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          // for yes
          if (
            applicantData.veteran_status === 3 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text)?.includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          //for one or more
          if (
            applicantData.veteran_status === 4 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text)?.includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }
          // for yes---

          if (
            applicantData.veteran_status === 1 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text)?.includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          //for decline
          if (
            applicantData.veteran_status === 5 &&
            // !veteran &&
            (fromatStirngInLowerCase(option?.text)?.includes("selfidentify") ||
              fromatStirngInLowerCase(option?.text)?.includes("dontwish") ||
              fromatStirngInLowerCase(option?.text)?.includes("decline") ||
              fromatStirngInLowerCase(option?.text)?.includes("notwish"))
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }
        });
      }
    });
  }
};

const fillCheckBox = async () => {
  const checkBox: HTMLInputElement = document.querySelector(
    '[ng-model="linkedInRecruiter.statusSync"]'
  );
  if (checkBox) {
    checkBox.click();
    checkBox.checked;
    handleValueChanges(checkBox);
  }
};

export const jobvite = async (tempDiv: any, applicantData: Applicant) => {
  await fillAllRadioType(applicantData);
  await fillSelect(tempDiv, applicantData);
  await fillCheckBox();
};
