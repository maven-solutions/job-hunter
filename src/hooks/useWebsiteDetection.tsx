import { useEffect, useState } from "react";

const useWebsiteDetection = (): [boolean, boolean] => {
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [showAutofillPage, setShowAutofillPage] = useState<boolean>(false);
  useEffect(() => {
    const url = window.location.href.toLowerCase();

    if (
      [
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
        "paycomonline.",
        ".gupy.",
        ".tracker",
      ].some((domain) => url.includes(domain))
    ) {
      setShowIcon(true);
      setShowAutofillPage(true);
      // return;
    }

    if (
      [
        "linkedin.",
        "indeed.",
        "dice.",
        "ziprecruiter.",
        "glassdoor.",
        "simplyhired.",
        "builtin.",
        "localhost",
      ].some((domain) => url.includes(domain))
    ) {
      setShowIcon(true);
      setShowAutofillPage(false);
    }

    // // some extra case
    if (
      [".battelle.", ".oraclecloud.", ".fisglobal."].some((domain) =>
        url.includes(domain)
      )
    ) {
      setShowIcon(true);
      setShowAutofillPage(true);
    }
  }, []);

  return [showIcon, showAutofillPage];
};

export default useWebsiteDetection;
