import { isEmptyArray } from "../../utils/helper";
import { Applicant } from "../data";
import { createFile } from "../FromFiller/fileTypeDataFiller";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillBasicInfo = (applicantData: Applicant) => {
  const firstname: any = document.querySelector('[name="first_name"]');
  if (firstname) {
    firstname.value = applicantData.first_name;
    handleValueChanges(firstname);
  }

  const lastname: any = document.querySelector('[name="last_name"]');
  if (lastname) {
    lastname.value = applicantData.last_name;
    handleValueChanges(lastname);
  }

  const email: any = document.querySelector('[name="e-mail_address"]');
  if (email) {
    email.value = applicantData.email_address;
    handleValueChanges(email);
  }

  const phone: any = document.querySelector(
    '[name="phone-numberphone__mobile_"]'
  );
  if (phone) {
    phone.value = Number(applicantData.phone_number);
    handleValueChanges(phone);
  }

  const address: any = document.querySelector('[name="address"]');
  if (address) {
    address.value = applicantData.address;
    handleValueChanges(address);
  }

  const city: any = document.querySelector('[name="city"]');
  if (city) {
    city.value = applicantData.city;
    handleValueChanges(city);
  }
  const zip: any = document.querySelector('[name="zip"]');
  if (zip) {
    zip.value = applicantData.zip_code;
    handleValueChanges(zip);
  }
};

const selectFiller = (applicantData: Applicant) => {
  const selectInputFields = document.querySelectorAll("select");
  if (isEmptyArray(selectInputFields)) return;

  for (const select of selectInputFields) {
    const selectid = select.getAttribute("id");
    const labelElement = document.querySelector(`[for="${selectid}"]`);

    const labelText = labelElement?.textContent?.trim();
    // for 18 years
    if (labelText?.toLowerCase().includes("18 years")) {
      Array.from(select.options).find((option: any) => {
        if (
          applicantData.is_over_18 &&
          fromatStirngInLowerCase(option?.text) === "yes"
        ) {
          option.selected = true;
          handleValueChanges(select);
        }

        if (
          !applicantData.is_over_18 &&
          fromatStirngInLowerCase(option?.text) === "no"
        ) {
          option.selected = true;
          handleValueChanges(select);
        }
      });
    }

    // for  legally authorized
    if (labelText?.toLowerCase().includes("legally authorized")) {
      Array.from(select.options).find((option: any) => {
        if (
          applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(option?.text) === "yes"
        ) {
          option.selected = true;
          handleValueChanges(select);
        }

        if (
          !applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(option?.text) === "no"
        ) {
          option.selected = true;
          handleValueChanges(select);
        }
      });
    }

    // for  require sponsorship
    if (labelText?.toLowerCase().includes("require sponsorship")) {
      Array.from(select.options).find((option: any) => {
        if (
          applicantData.sponsorship_required &&
          fromatStirngInLowerCase(option?.text) === "yes"
        ) {
          option.selected = true;
          handleValueChanges(select);
        }

        if (
          !applicantData.sponsorship_required &&
          fromatStirngInLowerCase(option?.text) === "no"
        ) {
          option.selected = true;
          handleValueChanges(select);
        }
      });
    }
  }
};

const fillResume = async (applicantData: Applicant) => {
  const fileField = document.querySelectorAll('input[type="file"]');
  if (fileField.length < 3) return;
  try {
    let textInputField: any = fileField[2];
    if (applicantData.pdf_url) {
      textInputField.setAttribute("ci-aria-file-uploaded", "true");
      // Create file asynchronously
      const designFile = await createFile(
        applicantData.pdf_url,
        applicantData.resume_title
      );
      // Set file to input field only for the first file input field found
      const dt = new DataTransfer();
      dt.items.add(designFile);
      textInputField.files = dt.files;
      // Trigger input change event
      textInputField.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const genderFiller = (applicantData: Applicant) => {
  const selectRadiolegend = document.querySelectorAll("legend");
  if (isEmptyArray(selectRadiolegend)) return;

  for (const legend of selectRadiolegend) {
    const labelText = legend?.textContent?.trim();

    // for gender
    if (labelText.toLowerCase().includes("gender")) {
      const labelId = legend.getAttribute("id");
      const radioSection = document.querySelector(
        `[aria-labelledby="${labelId}"]`
      );
      if (radioSection) {
        const allanswerLabel = radioSection.querySelectorAll("label");
        if (isEmptyArray(allanswerLabel)) return;
        for (const anserLabel of allanswerLabel) {
          const text = anserLabel?.textContent.trim();
          if (applicantData.gender?.toLowerCase() === text?.toLowerCase()) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }
        }
      }
    }
  }
};

const ethnicityFiller = (applicantData: Applicant) => {
  const selectRadiolegend = document.querySelectorAll("legend");
  if (isEmptyArray(selectRadiolegend)) return;

  for (const legend of selectRadiolegend) {
    const labelText = legend?.textContent?.trim();

    // for ethnicicy
    if (labelText?.toLowerCase()?.includes("hispanic")) {
      const labelId = legend?.getAttribute("id");
      const radioSection = document.querySelector(
        `[aria-labelledby="${labelId}"]`
      );
      if (radioSection) {
        const allanswerLabel = radioSection?.querySelectorAll("label");
        if (isEmptyArray(allanswerLabel)) return;
        for (const anserLabel of allanswerLabel) {
          const text = anserLabel?.textContent.trim();
          if (
            applicantData.hispanic_or_latino &&
            text?.toLowerCase() === "yes"
          ) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }
          if (
            !applicantData.hispanic_or_latino &&
            text?.toLowerCase() === "no"
          ) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }
        }
      }
    }
  }
};

const raceFiller = (applicantData: Applicant) => {
  const selectRadiolegend = document.querySelectorAll("legend");
  if (isEmptyArray(selectRadiolegend)) return;

  for (const legend of selectRadiolegend) {
    const labelText = legend?.textContent?.trim();

    // for ethnicicy
    if (labelText?.toLowerCase()?.includes("race")) {
      const labelId = legend?.getAttribute("id");
      const radioSection = document.querySelector(
        `[aria-labelledby="${labelId}"]`
      );
      if (radioSection) {
        const allanswerLabel = radioSection?.querySelectorAll("label");
        if (isEmptyArray(allanswerLabel)) return;
        for (const anserLabel of allanswerLabel) {
          const text = anserLabel?.textContent.trim();
          if (text?.toLowerCase().includes(applicantData.race.toLowerCase())) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }
        }
      }
    }
  }
};

const veteranFiller = (applicantData: Applicant) => {
  const selectRadiolegend = document.querySelectorAll("legend");
  if (isEmptyArray(selectRadiolegend)) return;

  for (const legend of selectRadiolegend) {
    const labelText = legend?.textContent?.trim();

    // for disability
    if (labelText?.includes("veterans")) {
      const labelId = legend?.getAttribute("id");
      const radioSection = document.querySelector(
        `[aria-labelledby="${labelId}"]`
      );
      if (radioSection) {
        const allanswerLabel = radioSection?.querySelectorAll("label");
        if (isEmptyArray(allanswerLabel)) return;
        for (const anserLabel of allanswerLabel) {
          const text = anserLabel?.textContent.trim();
          if (
            (applicantData.veteran_status === 1 ||
              applicantData.veteran_status === 3 ||
              applicantData.veteran_status === 4) &&
            text ===
              "I identify as one or more of the classifications of protected veteran listed below."
          ) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }

          if (
            applicantData.veteran_status === 2 &&
            text === "I am not a protected veteran."
          ) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }

          if (
            applicantData.veteran_status === 5 &&
            text === "I do not wish to provide this information."
          ) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }
        }
      }
    }
  }
};

const disabilityFiller = (applicantData: Applicant) => {
  const selectRadiolegend = document.querySelectorAll("legend");
  if (isEmptyArray(selectRadiolegend)) return;

  for (const legend of selectRadiolegend) {
    const labelText = legend?.textContent?.trim();

    // for disability
    if (labelText?.includes("Please Check one of the boxes below")) {
      const labelId = legend?.getAttribute("id");
      const radioSection = document.querySelector(
        `[aria-labelledby="${labelId}"]`
      );
      if (radioSection) {
        const allanswerLabel = radioSection?.querySelectorAll("label");
        if (isEmptyArray(allanswerLabel)) return;
        for (const anserLabel of allanswerLabel) {
          const text = anserLabel?.textContent.trim();
          if (
            applicantData.disability_status &&
            text === "Yes, I have a disability, or have had one in the past"
          ) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }

          if (
            !applicantData.disability_status &&
            text ===
              "No, I do not have a disability and have not had one in the past"
          ) {
            anserLabel?.click();
            handleValueChanges(anserLabel);
          }
        }
      }
    }
  }
};
export const thyssenkrupp = async (tempDiv: any, applicantData: Applicant) => {
  fillBasicInfo(applicantData);
  selectFiller(applicantData);
  fillResume(applicantData);
  genderFiller(applicantData);
  ethnicityFiller(applicantData);
  await delay(1000);
  raceFiller(applicantData);
  veteranFiller(applicantData);
  disabilityFiller(applicantData);
};
