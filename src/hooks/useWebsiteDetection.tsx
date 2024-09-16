import { useEffect, useState } from "react";

const useWebsiteDetection = (): [boolean, boolean, boolean] => {
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [showAutofillPage, setShowAutofillPage] = useState<boolean>(false);
  const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
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
        ".aquent",
        ".lemonade.",
        "tri-north.",
        "jobdiva.",
      ].some((domain) => url.includes(domain))
    ) {
      setShowIcon(true);
      setShowAutofillPage(true);
    }

    const pathurl = window.location.href.toLocaleLowerCase();
    const splitted = pathurl.split("/");
    if (splitted && splitted.length > 2) {
      const currentWebURL = splitted[2];
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
        ].some((domain) => currentWebURL.includes(domain))
      ) {
        setShowIcon(true);
        setShowAutofillPage(false);
      }
    }

    // // some extra case
    // if (
    //   [
    //     ".battelle.",
    //     ".oraclecloud.",
    //     ".fisglobal.",
    //     ".mercy.",
    //     ".eightfold.",
    //   ].some((domain) => url.includes(domain))
    // ) {
    //   setShowIcon(true);
    //   setShowAutofillPage(true);
    // }

    // for iframe issue show error
    if (
      [
        "inovalon.",
        "adaptivebiotech.",
        "muckrack.",
        "truelinkfinancial.",
        "modular.",
        ".mativ.",
        "ordergroove.",
        ".cdwjobs",
        "payitgov.",
        "kentik.",
        "unanet.",
        "ensono.",
        "unqork.",
        "grin.",
        "alloy.",
        "alixpartners.",
      ].some((domain) => url.includes(domain))
    ) {
      setShowIcon(true);
      setShowAutofillPage(false);
      setShowErrorPage(true);
    }
  }, []);

  return [showIcon, showAutofillPage, showErrorPage];
};

export default useWebsiteDetection;
