import { LOCALSTORAGE } from "../utils/constant";
import { getDomainName } from "../utils/helper";

export const saveMyworkdayjobsData = async () => {
  const mainDiv = document.querySelector("#mainContent");
  if (!mainDiv) return;
  const firstChild = mainDiv?.firstChild;
  const firstGrandChild: any = firstChild?.firstChild;
  const titleEle: any = firstGrandChild?.querySelector("h3");
  const title = titleEle?.textContent?.trim();
  const data = {
    title: title,
    source: getDomainName(),
    url: window.location.href,
  };
  console.log("data::", data);

  localStorage.setItem(LOCALSTORAGE.JOB_APPLIED, window.location.href);
};
