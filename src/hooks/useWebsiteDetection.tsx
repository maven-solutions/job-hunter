import { useEffect, useState } from "react";

interface WebsiteConfig {
  domains: string[];
  showAutofillPage: boolean;
}

const useWebsiteDetection = (): [boolean, boolean] => {
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [showAutofillPage, setShowAutofillPage] = useState<boolean>(false);

  useEffect(() => {
    const url = window.location.href.toLowerCase();

    const websiteConfigs: WebsiteConfig[] = [
      {
        domains: [
          "job",
          "apply",
          "career",
          "carees",
          "work",
          "placement",
          ".adp.",
          "services",
          ".services.",
          "peoplehr.",
          ".ebayinc.",
          ".myworkdayjobs.",
          ".paylocity.",
          "motionrecruitment.",
          ".lever.",
          ".icims.",
          "techfetch.",
          ".tal.",
          ".fisglobal.",
          ".jobdiva.",
          ".pinpointhq.",
          ".teds.",
          ".entertimeonline.",
          ".dayforcehcm.",
          ".cisco.",
          ".jobvite.",
          ".pinkertonhr.",
          "jackhenry.",
          ".clearcompany.",
          ".ashbyhq.",
          ".zohorecruit.",
          ".successfactors.",
          ".greenhouse.",
          ".oraclecloud.",
        ],
        showAutofillPage: true,
      },
      {
        domains: [
          "linkedin.",
          "indeed.",
          "dice.",
          "ziprecruiter.",
          "glassdoor.",
          "simplyhired.",
          "builtin.",
          "localhost",
        ],
        showAutofillPage: false,
      },
      {
        domains: [".battelle.", ".oraclecloud."],
        showAutofillPage: true,
      },
    ];

    const matchedConfig = websiteConfigs.find((config) =>
      config.domains.some((domain) => url.includes(domain))
    );

    if (matchedConfig) {
      setShowIcon(true);
      setShowAutofillPage(matchedConfig.showAutofillPage);
    }
  }, []);

  return [showIcon, showAutofillPage];
};

export default useWebsiteDetection;
