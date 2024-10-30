import { saveAudofillJob } from "../utils/autofillJobSavApi";
import { getDomainName } from "../utils/helper";

export const savejobviteData = async () => {
  const jobTitleElement = document.querySelector("h2.jv-header");
  if (!jobTitleElement) return;

  const data = {
    title: jobTitleElement?.textContent?.trim(),
    source: getDomainName(),
    url: window.location.href,
  };
  if (jobTitleElement?.textContent?.trim()) {
    await saveAudofillJob(data);
  }
};
