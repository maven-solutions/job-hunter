import { saveAudofillJob } from "../utils/autofillJobSavApi";
import { getDomainName, isEmptyArray } from "../utils/helper";
function getFirstWord(input) {
  // Check if input is null or not a string, return empty string if true
  if (input === null || typeof input !== "string") {
    return "";
  }

  // Split the string by spaces and return the first word
  let words = input.trim().split(" ");

  // Return the first word, or an empty string if there are no words
  return words.length > 0 ? words[0] : "";
}
export const saveJobLeverData = async () => {
  let company = "";
  let location = "";

  const logoElement = document.querySelector(".main-header-logo");
  if (logoElement) {
    const img = logoElement?.querySelector("img");
    if (img) {
      const altText = img?.getAttribute("alt");
      if (altText) {
        company = getFirstWord(altText);
      }
    }
  }
  const header = document.querySelector(
    ".section.page-centered.posting-header"
  );

  if (!header) return;
  const jobTitleElement: any = header?.querySelector("h2") ?? "";
  const locationElement: any =
    header?.querySelector(".posting-categories") ?? "";

  const allLocationChild = locationElement?.children;
  if (!isEmptyArray(allLocationChild)) {
    const loc = allLocationChild[0];
    if (loc) {
      location = loc?.textContent?.trim();
    }
  }
  const data = {
    title: jobTitleElement?.textContent?.trim(),
    company: company,
    location: location,
    source: getDomainName(),
    url: window.location.href,
  };

  if (jobTitleElement?.textContent?.trim()) {
    await saveAudofillJob(data);
  }
};
