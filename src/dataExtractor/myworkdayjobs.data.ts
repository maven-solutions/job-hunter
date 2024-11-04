import { saveAudofillJob } from "../utils/autofillJobSavApi";
import { LOCALSTORAGE } from "../utils/constant";
import { getDomainName } from "../utils/helper";

export const saveMyworkdayjobsData = async () => {
  const mainDiv = document.querySelector("#mainContent");
  if (!mainDiv) return;

  const firstChild = mainDiv?.firstChild;
  if (!firstChild) return;

  const firstGrandChild: any = firstChild?.firstChild;
  if (!firstGrandChild) return;

  const titleEle: any = firstGrandChild?.querySelector("h3");
  if (!titleEle) return;

  const title = titleEle?.textContent?.trim();
  if (!title) return;

  const data = {
    title: title,
    source: getDomainName(),
    url: window.location.href,
  };

  if (title) {
    // await saveAudofillJob(data);
  }

  localStorage.setItem(LOCALSTORAGE.JOB_APPLIED, window.location.href);
};
