import { useEffect, useState } from "react";

const useWebsiteDetection = (): [boolean, boolean] => {
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [showAutofillPage, setShowAutofillPage] = useState<boolean>(false);

  useEffect(() => {
    const url = window.location.href.toLowerCase();

    // List of domains and whether to show the autofill page
    const domainConfigs: { domain: string; showAutofillPage: boolean }[] = [
      { domain: "linkedin.", showAutofillPage: false },
      { domain: "indeed.", showAutofillPage: false },
      { domain: "dice.", showAutofillPage: false },
      { domain: "ziprecruiter.", showAutofillPage: false },
      { domain: "glassdoor.", showAutofillPage: false },
      { domain: "simplyhired.", showAutofillPage: false },
      { domain: "builtin.", showAutofillPage: false },
      { domain: "localhost", showAutofillPage: false },
      // Add more domains as needed
      { domain: "job", showAutofillPage: true },
      { domain: "apply", showAutofillPage: true },
      { domain: "career", showAutofillPage: true },
      { domain: "carees", showAutofillPage: true },
      { domain: "work", showAutofillPage: true },
      { domain: "placement", showAutofillPage: true },
      { domain: ".adp.", showAutofillPage: true },
      { domain: "services", showAutofillPage: true },
      { domain: ".services.", showAutofillPage: true },
      { domain: "peoplehr.", showAutofillPage: true },
      { domain: ".ebayinc.", showAutofillPage: true },
      { domain: ".myworkdayjobs.", showAutofillPage: true },
      { domain: ".paylocity.", showAutofillPage: true },
      { domain: "motionrecruitment.", showAutofillPage: true },
      { domain: ".lever.", showAutofillPage: true },
      { domain: ".icims.", showAutofillPage: true },
      { domain: "techfetch.", showAutofillPage: true },
      { domain: ".tal.", showAutofillPage: true },
      { domain: ".fisglobal.", showAutofillPage: true },
      { domain: ".jobdiva.", showAutofillPage: true },
      { domain: ".pinpointhq.", showAutofillPage: true },
      { domain: ".teds.", showAutofillPage: true },
      { domain: ".entertimeonline.", showAutofillPage: true },
      { domain: ".dayforcehcm.", showAutofillPage: true },
      { domain: ".cisco.", showAutofillPage: true },
      { domain: ".jobvite.", showAutofillPage: true },
      { domain: ".pinkertonhr.", showAutofillPage: true },
      { domain: "jackhenry.", showAutofillPage: true },
      { domain: ".clearcompany.", showAutofillPage: true },
      { domain: ".ashbyhq.", showAutofillPage: true },
      { domain: ".zohorecruit.", showAutofillPage: true },
      { domain: ".successfactors.", showAutofillPage: true },
      { domain: ".greenhouse.", showAutofillPage: true },
      { domain: ".oraclecloud.", showAutofillPage: true },
      // Add more domains as needed
    ];

    // Check if the URL matches any domain
    const matchedDomainConfig = domainConfigs.find((config) =>
      url.includes(config.domain)
    );

    if (matchedDomainConfig) {
      setShowIcon(true);
      setShowAutofillPage(matchedDomainConfig.showAutofillPage);
    } else {
      setShowIcon(false);
      setShowAutofillPage(false);
    }
  }, []);

  return [showIcon, showAutofillPage];
};

export default useWebsiteDetection;
