import { saveAudofillJob } from "../utils/autofillJobSavApi";
import { getDomainName } from "../utils/helper";

export const saveGreenhouseData = async () => {
  const header = document.querySelector("#header");
  if (!header) return;
  const jobTitleElement: any = header?.querySelector(".app-title") ?? "";
  const companyNameElement: any = header?.querySelector(".company-name") ?? "";
  const locationElement: any = header?.querySelector(".location") ?? "";

  const data = {
    title: jobTitleElement?.textContent?.trim(),
    company: companyNameElement?.textContent?.trim(),
    location: locationElement?.textContent?.trim(),
    source: getDomainName(),
    url: window.location.href,
  };
  if (jobTitleElement?.textContent?.trim()) {
    await saveAudofillJob(data);
  }
};
