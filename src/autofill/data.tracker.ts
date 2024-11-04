import { saveAudofillJob } from "../utils/autofillJobSavApi";
import { getDomainName } from "../utils/helper";

const dataTracker = async () => {
  const data = {
    source: getDomainName(),
    url: window.location.href,
  };
  await saveAudofillJob(data);
};

export const dataTrackerHandler = async () => {
  await dataTracker();
};
