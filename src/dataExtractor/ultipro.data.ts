import { getDomainName } from "../utils/helper";

export const saveUltiproData = async () => {
  const jobTitleElement = document.querySelector("#OpportunityTitle");
  if (!jobTitleElement) return;

  const data = {
    title: jobTitleElement?.textContent?.trim(),
    source: getDomainName(),
    url: window.location.href,
  };
  console.log("data::", data);
};
