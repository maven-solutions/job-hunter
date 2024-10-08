import { delay, handleValueChanges } from "./helper";

export const mailinator = async () => {
  const input: any = document.getElementById("inbox_field");
  if (input) {
    chrome.storage.local.get(["aiemail"]).then((result) => {
      const data = result?.aiemail;
      if (data) {
        input.value = data;
        handleValueChanges(data);
      }
    });
  }
  await delay(1000);
  const form = document.querySelector(".ng-pristine.ng-valid");
  if (form) {
    const cbutton = form.querySelector("button");
    cbutton.click();
    handleValueChanges(cbutton);
  }
};
