import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const textfieldFiller = async (applicantData: Applicant) => {
  const lastname: any = document.getElementById("actionItem.lastName.idTag");
  lastname.value = applicantData.last_name;
  //
  const email: any = document.getElementById("actionItem.email.idTag");
  email.value = applicantData.email_address;
};

const selectFiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let veteran = false;
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    // for ethicicy

    if (
      fromatStirngInLowerCase(label?.textContent)?.includes(
        fromatStirngInLowerCase("ETHNICITY")
      )
    ) {
      const labelid = label.getAttribute("for");
      if (!labelid) {
        return;
      }
      const select = document.getElementById(labelid) as HTMLSelectElement;
      if (!select) {
        return;
      }
      Array.from(select.options).find((option: any) => {
        //for yes
        if (
          applicantData.hispanic_or_latino &&
          fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase("Hispanic or Latino")
        ) {
          option.selected = true;
          handleValueChanges(option);
        }

        if (
          !applicantData.hispanic_or_latino &&
          fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase("Not Hispanic or Latino")
        ) {
          option.selected = true;
          handleValueChanges(option);
        }
      });
    }
    // for veteran
    if (
      fromatStirngInLowerCase(label?.textContent)?.includes(
        fromatStirngInLowerCase("VETERAN")
      )
    ) {
      const labelid = label.getAttribute("for");
      if (!labelid) {
        return;
      }
      const select = document.getElementById(labelid) as HTMLSelectElement;
      if (!select) {
        return;
      }
      Array.from(select.options).find((option: any) => {
        //for yes
        if (
          applicantData.veteran_status === 1 &&
          !veteran &&
          (fromatStirngInLowerCase(option?.text)?.includes("amaveteran") ||
            fromatStirngInLowerCase(option?.text)?.includes("identifymyself"))
        ) {
          option.selected = true;
          handleValueChanges(option);
          veteran = true;
        }

        if (
          applicantData.veteran_status === 2 &&
          !veteran &&
          fromatStirngInLowerCase(option?.text)?.includes("iamnot")
        ) {
          option.selected = true;
          handleValueChanges(option);
          veteran = true;
        }

        // for yes
        if (
          applicantData.veteran_status === 3 &&
          !veteran &&
          fromatStirngInLowerCase(option?.text)?.includes("identifyasaveteran")
        ) {
          option.selected = true;
          handleValueChanges(option);
          veteran = true;
        }

        // for yes
        if (
          applicantData.veteran_status === 3 &&
          !veteran &&
          fromatStirngInLowerCase(option?.text)?.includes("identifyasoneormore")
        ) {
          option.selected = true;
          handleValueChanges(option);
        }

        //for one or more
        if (
          applicantData.veteran_status === 4 &&
          !veteran &&
          fromatStirngInLowerCase(option?.text)?.includes("identifyasoneormore")
        ) {
          option.selected = true;
          handleValueChanges(option);
          veteran = true;
        }
        // for yes---

        if (
          applicantData.veteran_status === 1 &&
          !veteran &&
          fromatStirngInLowerCase(option?.text)?.includes("identifyasoneormore")
        ) {
          option.selected = true;
          handleValueChanges(option);
          veteran = true;
        }

        //for decline
        if (
          applicantData.veteran_status === 5 &&
          !veteran &&
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
  }
};

const radiotypefiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll(
    ".p-viewSF-psqmultichoicesingleanswer"
  );
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    //
    const labedIdv = label.querySelector(".p-htmlviewer");
    const labelText = labedIdv?.textContent;

    if (labelText.includes("legally eligible")) {
      const divid = labedIdv.getAttribute("id");
      const radiogroup = label.querySelector(`[aria-labelledby="${divid}"]`);
      const allLabelBtn = radiogroup.querySelectorAll("label");
      if (!allLabelBtn || allLabelBtn.length === 0) {
        return;
      }

      const yesbtn = allLabelBtn[0];
      const nobtn = allLabelBtn[1];

      if (applicantData.us_work_authoriztaion) {
        yesbtn.click();
        handleValueChanges(yesbtn);
      }
      if (!applicantData.us_work_authoriztaion) {
        nobtn.click();
        handleValueChanges(yesbtn);
      }
    }
  }

  // const isAdult = document.querySelector('[aria-labelledby="11"]');
  // const raidoList = isAdult.children ?? "";
  // const radioyes: any = raidoList[0];
  // const radiono: any = raidoList[1];
  // if (applicantData.is_over_18) {
  //   radioyes.click();
  // }
  // if (!applicantData.is_over_18) {
  //   radiono.click();
  // }
};
export const csod = async (tempDiv: any, applicantData: Applicant) => {
  await delay(3000);
  await textfieldFiller(applicantData);
  await radiotypefiller(applicantData);
  await delay(2000);
  await selectFiller(applicantData);
};
