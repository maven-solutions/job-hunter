import { fileTypeDataFiller } from "../FromFiller/fileTypeDataFiller";
import { Applicant } from "../data";
import { delay } from "../helper";

export const successfactors = async (
  tempDivs: any,
  applicantData: Applicant
) => {
  const acceptButton: any = document.querySelector(
    ".attachmentLabel.attachmentText"
  );
  if (acceptButton) {
    acceptButton.click();
  }
  await delay(1000);
  let tempDiv: any = document.querySelector("form");
  // console.log("tempvid::", tempDiv);
  let tempDivForFile = document.querySelector("body");
  fileTypeDataFiller(tempDivForFile, applicantData, false);

  await delay(1000);
};
