import { saveAudofillJob } from "../utils/autofillJobSavApi";
import { getDomainName } from "../utils/helper";

export const dataTracker = async () => {
  const data = {
    source: getDomainName(),
    url: window.location.href,
  };
  await saveAudofillJob(data);
};
