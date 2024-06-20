import { checkIfExist, delay, fromatStirngInLowerCase } from "../helper";
import { fieldNames } from "./fieldsname";

export const customSelectFiller2 = async (tempDiv1, applicantData, iframe) => {
  let race = false;
  let gender = false;
  let disability = false;

  // console.log("selctfiring---::");

  // const inputEle: any = document.querySelector("#input-30");
  // // const inputEle: any = document.querySelector("#input-37");
  // // console.log("selct::", inputEle);
  // inputEle.click();
  // await delay(2000);
  // inputEle.focus();
  // inputEle.value = "biology";
  // await delay(2000);
  // inputEle.focus();
  // inputEle.click();
  // //-----
  // const event = new KeyboardEvent("keydown", {
  //   key: "Enter",
  //   code: "Enter",
  //   which: 13,
  //   keyCode: 13,
  // });
  // document.getElementById("input-30").dispatchEvent(event);
  // await delay(3000);

  // const selectOptions: any = document.querySelectorAll('[role="option"]');

  // for (const [index, element] of selectOptions.entries()) {
  //   // console.log(element);
  //   if (index == 1) {
  //     const input = element.querySelector("input");
  //     console.log(input);
  //     input.focus();
  //     input.click();
  //     input.checked = true;
  //     return true;
  //   }
  //   // if (
  //   //   fromatStirngInLowerCase(element.textContent.trim()) ===
  //   //   fromatStirngInLowerCase("biology")
  //   // ) {
  //   //   const input = element.querySelector("input");
  //   //   console.log(input);
  //   //   input.focus();
  //   //   input.click();
  //   //   input.checked = true;
  //   //   return true;
  //   // }
  // }
  // await delay(1000);
  // return;
  const tempDiv = document.querySelector("body");
  const selectButtonFields: any =
    document.querySelectorAll('[role="combobox"]');

  // fillDeviceType(applicantData);
  if (selectButtonFields.length === 0) {
    return;
  }
  for (const [selectIndex, select] of selectButtonFields.entries()) {
    const attributes: any = Array.from(select.attributes);

    for (const attribute of attributes) {
      // for gender
      if (checkIfExist(attribute.value, fieldNames.gender) && !gender) {
        select.click();
        await delay(200);
        // console.log("state::gender");
        const selectOptions: any = document.querySelectorAll('[role="option"]');
        for (const [index, element] of selectOptions.entries()) {
          if (
            fromatStirngInLowerCase(element.textContent.trim()) ===
              fromatStirngInLowerCase(applicantData.gender) &&
            !gender
          ) {
            gender = true;
            element.click();
            // return true;
          }
        }
        await delay(1000);
      }

      // for race
      if (checkIfExist(attribute.value, fieldNames.race) && !race) {
        select.click();
        await delay(200);
        const selectOptions: any = document.querySelectorAll('[role="option"]');
        for (const [index, element] of selectOptions.entries()) {
          if (
            fromatStirngInLowerCase(element.textContent.trim()).includes(
              fromatStirngInLowerCase(applicantData.race)
            ) &&
            !race
          ) {
            race = true;
            element.click();
            // return true;
          }
        }
        await delay(1000);
      }

      // for disability statys
      if (
        checkIfExist(attribute.value, fieldNames.disability_status) &&
        !disability
      ) {
        select.click();
        await delay(200);
        const selectOptions: any = document.querySelectorAll('[role="option"]');
        for (const [index, element] of selectOptions.entries()) {
          if (
            fromatStirngInLowerCase(element.textContent.trim()).includes(
              "yes"
            ) &&
            applicantData.disability_status &&
            !disability
          ) {
            disability = true;
            element.click();
          }

          if (
            fromatStirngInLowerCase(element.textContent.trim()).includes(
              "no"
            ) &&
            !applicantData.disability_status &&
            !disability
          ) {
            disability = true;
            element.click();
          }
        }
        await delay(1000);
      }
    }
  }
};
