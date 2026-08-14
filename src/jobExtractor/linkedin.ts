interface CompanyDetails {
  name?: string | null;
  logo?: string | null;
  summary?: string | null;
  link?: string | null;
  description?: string | null;
}

interface RecruiterDetails {
  name?: string | null;
  profileImage?: string | null;
  link?: string | null;
  title?: string | null;
  description?: string | null;
}

interface ExtractedLinkedInJob {
  postUrl?: string | null;
  title?: string | null;
  companyName?: string | null;
  location?: string | null;
  postedDate?: string | null;
  description?: string | null;
  jobOverview?: string[] | null;
  jobType?: string | null;
  employment?: string | null;
  easyApply?: boolean | null;
  source?: string | null;
  companyDetails?: CompanyDetails;
  recruiterDetails?: RecruiterDetails;
}

function sanitizeHtml(description?: string | null): string {
  if (!description) return "";

  const sanitizedHtml = description.replace(/<(?!br\s*\/?)[^>]+>/gi, "");
  const cleanedHtml = sanitizedHtml
    .replace(/…/g, "")
    .replace(/\bshow more\b/gi, "")
    .replace(/\bmore\b$/gi, "");

  return cleanedHtml.trim().replace(/<!---->\s*/g, "");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSduiRoot = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(
    '[data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.SemanticJobDetails"]',
  );

const getLegacyTitleEl = (): Element | null =>
  document.getElementsByClassName(
    "job-details-jobs-unified-top-card__job-title",
  )?.[0] ?? null;

const isJobPanelReady = (): boolean => {
  if (getLegacyTitleEl()?.textContent?.trim()) return true;
  if (getSduiRoot()) return true;
  if (document.querySelector('[id^="JobDetails_AboutTheJob_"]')) return true;
  if (document.querySelector('a[href*="/jobs/view/"]')) return true;
  return false;
};

const waitForJobPanel = async (
  maxAttempts = 20,
  intervalMs = 300,
): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (isJobPanelReady()) return true;
    await sleep(intervalMs);
  }
  return isJobPanelReady();
};

const expandJobDescription = () => {
  const moreBtn =
    document.querySelector<HTMLButtonElement>(
      '[id^="JobDetails_AboutTheJob_"] [data-testid="expandable-text-button"]',
    ) ||
    document.querySelector<HTMLButtonElement>(
      '[data-testid="expandable-text-box"] [data-testid="expandable-text-button"]',
    ) ||
    document.querySelector<HTMLButtonElement>(
      '[data-testid="expandable-text-button"]',
    );

  moreBtn?.click?.();
};

const extractTitle = (): string | null => {
  const legacy = getLegacyTitleEl()?.textContent?.trim();
  if (legacy) return legacy;

  const root = getSduiRoot() || document.body;
  const jobLinks = Array.from(
    root.querySelectorAll<HTMLAnchorElement>('a[href*="/jobs/view/"]'),
  );

  for (const link of jobLinks) {
    const title = link?.textContent?.trim();
    if (title && title.length > 2 && !/^(apply|save|full-time)$/i.test(title)) {
      return title;
    }
  }

  // Sticky header / any visible job title link on the page
  const anyJobLink = document.querySelector<HTMLAnchorElement>(
    'a[href*="/jobs/view/"]',
  );
  return anyJobLink?.textContent?.trim() || null;
};

const extractCompanyName = (): string | null => {
  const legacy = document
    .querySelector(".job-details-jobs-unified-top-card__company-name")
    ?.textContent?.trim();
  if (legacy) return legacy;

  const root = getSduiRoot() || document.body;
  const ariaLabel = root
    .querySelector<HTMLElement>('[aria-label^="Company,"]')
    ?.getAttribute("aria-label");
  if (ariaLabel?.startsWith("Company,")) {
    return ariaLabel.replace(/^Company,\s*/i, "").trim();
  }

  const companyLink = root.querySelector<HTMLAnchorElement>(
    'a[href*="/company/"]',
  );
  if (companyLink?.textContent?.trim()) {
    return companyLink.textContent.trim();
  }

  // "Company • Location"
  for (const el of Array.from(root.querySelectorAll("p, span"))) {
    const text = el?.textContent?.trim() ?? "";
    if (text.includes("•") && text.length < 150) {
      const company = text.split("•")?.[0]?.trim();
      if (company && !/ago|apply|save/i.test(company)) return company;
    }
  }

  return null;
};

const extractLocation = (): string | null => {
  const locationText = document
    .querySelector(
      ".job-details-jobs-unified-top-card__primary-description-without-tagline",
    )
    ?.textContent?.trim()
    ?.split("·")?.[1]
    ?.trim();
  if (locationText) return locationText;

  const tertiary = document.querySelector(
    ".job-details-jobs-unified-top-card__tertiary-description",
  );
  const tertiaryLocation = (
    tertiary?.childNodes?.[1] as HTMLElement | undefined
  )?.textContent?.trim();
  if (tertiaryLocation) return tertiaryLocation;

  const listLocation = document
    .querySelector(
      ".job-details-jobs-unified-top-card__primary-description-container",
    )
    ?.querySelectorAll(".tvm__text")?.[0]
    ?.textContent?.trim();
  if (listLocation) return listLocation;

  const root = getSduiRoot() || document.body;

  for (const p of Array.from(root.querySelectorAll("p"))) {
    const text = p?.textContent?.trim() ?? "";
    if (
      text.includes("·") &&
      (/\bago\b/i.test(text) || /clicked apply|applicants?/i.test(text))
    ) {
      const location = text.split("·")?.[0]?.trim();
      if (location && !/responses managed/i.test(location)) return location;
    }
  }

  for (const el of Array.from(root.querySelectorAll("p, span"))) {
    const text = el?.textContent?.trim() ?? "";
    if (text.includes("•") && text.length < 150) {
      const location = text.split("•")?.[1]?.trim();
      if (location) return location;
    }
  }

  return null;
};

const formatYyyyMmDd = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parsePostedDate = (raw: string): string => {
  const text = raw
    .replace(/^(Posted|Reposted)\s+(on\s+)?/i, "")
    .replace(/\.$/, "")
    .trim();
  if (!text) return "n/a";

  const today = new Date();

  if (
    /^(just now|today|now)$/i.test(text) ||
    /\b(minute|hour)s?\s+ago\b/i.test(text)
  ) {
    return formatYyyyMmDd(today);
  }

  if (/^yesterday$/i.test(text)) {
    today.setDate(today.getDate() - 1);
    return formatYyyyMmDd(today);
  }

  const relative = text.match(
    /(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/i,
  );
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const date = new Date();

    switch (unit) {
      case "minute":
      case "hour":
        break;
      case "day":
        date.setDate(date.getDate() - amount);
        break;
      case "week":
        date.setDate(date.getDate() - amount * 7);
        break;
      case "month":
        date.setMonth(date.getMonth() - amount);
        break;
      case "year":
        date.setFullYear(date.getFullYear() - amount);
        break;
    }

    return formatYyyyMmDd(date);
  }

  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return formatYyyyMmDd(parsed);
  }

  return "n/a";
};

const extractPostedDate = (): string => {
  const nextElement = document.querySelector("#job-details")
    ?.nextElementSibling as HTMLElement | null;

  if (nextElement?.textContent) {
    const parsed = parsePostedDate(nextElement.textContent);
    if (parsed !== "n/a") return parsed;
  }

  const root = getSduiRoot() || document.body;

  for (const el of Array.from(root.querySelectorAll("strong"))) {
    const text = el?.textContent?.trim() ?? "";
    if (
      /\bago\b/i.test(text) ||
      /\b\d+\s*(day|hour|week|month|minute)s?\b/i.test(text)
    ) {
      return parsePostedDate(text);
    }
  }

  for (const p of Array.from(root.querySelectorAll("p"))) {
    const text = p?.textContent?.trim() ?? "";
    if (text.includes("·") && /\bago\b/i.test(text)) {
      const posted = text
        .split("·")
        .map((part) => part.trim())
        .find((part) => /\bago\b/i.test(part));
      if (posted) return parsePostedDate(posted);
    }
  }

  return "n/a";
};

const extractJobType = (): string | null => {
  const root = getSduiRoot() || document.body;
  for (const el of Array.from(root.querySelectorAll("a, button, span"))) {
    const text = el?.textContent?.trim() ?? "";
    if (
      /^(Full-time|Part-time|Contract|Temporary|Internship|Volunteer)$/i.test(
        text,
      )
    ) {
      return text;
    }
  }
  return null;
};

const extractEasyApply = (): boolean | null => {
  const root = getSduiRoot() || document.body;
  if (root.querySelector('[aria-label="Apply on company website"]')) {
    return false;
  }

  const easyApply = Array.from(root.querySelectorAll("button, a")).find(
    (el) =>
      /easy apply/i.test(el?.textContent ?? "") ||
      /easy apply/i.test(el?.getAttribute("aria-label") ?? ""),
  );

  return easyApply ? true : null;
};

const extractDescription = (): string | null => {
  const legacy = document.querySelector(
    ".jobs-description__container",
  ) as HTMLElement | null;
  if (legacy?.innerHTML?.trim()) return legacy.innerHTML;

  expandJobDescription();

  const aboutBox =
    document.querySelector<HTMLElement>(
      '[id^="JobDetails_AboutTheJob_"] [data-testid="expandable-text-box"]',
    ) ||
    document.querySelector<HTMLElement>(
      '[data-sdui-component*="aboutTheJob"] [data-testid="expandable-text-box"]',
    ) ||
    document.querySelector<HTMLElement>('[data-testid="expandable-text-box"]');

  if (aboutBox?.innerHTML?.trim()) return aboutBox.innerHTML;

  const aboutSection = document.querySelector<HTMLElement>(
    '[id^="JobDetails_AboutTheJob_"], [data-sdui-component*="aboutTheJob"]',
  );
  return aboutSection?.innerHTML?.trim() ? aboutSection.innerHTML : null;
};

const getCompanyDetails = (): CompanyDetails => {
  const companyDetails: CompanyDetails = {};

  const companyDetailsEle =
    document.querySelector<HTMLElement>(".jobs-company__box");

  if (companyDetailsEle) {
    companyDetails.logo =
      companyDetailsEle.querySelector<HTMLImageElement>("img")?.src ?? null;

    const atag = companyDetailsEle.querySelector<HTMLAnchorElement>(
      ".artdeco-entity-lockup__content a",
    );
    companyDetails.name = atag?.textContent?.trim() ?? null;
    companyDetails.link = atag?.getAttribute("href")
      ? `https://www.linkedin.com${atag.getAttribute("href")}`
      : null;

    const summarySection =
      companyDetailsEle.querySelector<HTMLElement>(".t-14.mt5");
    companyDetails.summary =
      summarySection?.textContent
        ?.split("\n")
        ?.map((part) => part.trim())
        ?.filter((part) => part !== "")
        ?.join(" • ") ?? null;

    const desc = companyDetailsEle.querySelector<HTMLElement>(
      ".jobs-company__company-description > *:first-child",
    );
    companyDetails.description = sanitizeHtml(desc?.innerHTML) || null;
    return companyDetails;
  }

  const root = getSduiRoot() || document.body;
  const companyBlock =
    root.querySelector<HTMLElement>('[aria-label^="Company,"]') ||
    root.querySelector<HTMLElement>('a[href*="/company/"]');

  if (!companyBlock) return companyDetails;

  const companyLink =
    (companyBlock.closest("a") as HTMLAnchorElement | null) ||
    companyBlock.querySelector<HTMLAnchorElement>("a[href*='/company/']") ||
    root.querySelector<HTMLAnchorElement>('a[href*="/company/"]');

  companyDetails.link = companyLink?.href?.split("?")?.[0] ?? null;

  const ariaLabel = companyBlock.getAttribute("aria-label");
  companyDetails.name = ariaLabel?.startsWith("Company,")
    ? ariaLabel.replace(/^Company,\s*/i, "").trim()
    : (companyLink?.textContent?.trim() ?? null);

  companyDetails.logo =
    companyBlock.querySelector<HTMLImageElement>("img")?.src ||
    companyLink?.querySelector<HTMLImageElement>("img")?.src ||
    null;

  const aboutCompany = document.querySelector<HTMLElement>(
    '[id^="JobDetails_AboutTheCompany_"], [data-sdui-component*="aboutTheCompany"]',
  );
  companyDetails.description = aboutCompany?.textContent?.trim()
    ? sanitizeHtml(aboutCompany.innerHTML) || null
    : null;

  return companyDetails;
};

const getHiringTeamDetails = (): RecruiterDetails => {
  const recruiterDetails: RecruiterDetails = {};
  const hiringSectionEle = document.querySelector(
    ".hirer-card__hirer-information",
  );
  if (!hiringSectionEle) return recruiterDetails;

  recruiterDetails.name =
    hiringSectionEle
      .querySelector<HTMLElement>(".jobs-poster__name strong")
      ?.textContent?.trim() ?? null;

  recruiterDetails.link =
    hiringSectionEle.querySelector<HTMLAnchorElement>("a")?.href ?? null;

  recruiterDetails.profileImage =
    hiringSectionEle.previousElementSibling?.querySelector?.<HTMLImageElement>(
      "img",
    )?.src ?? null;

  recruiterDetails.title =
    hiringSectionEle
      .querySelector<HTMLElement>(".text-body-small")
      ?.textContent?.trim() ?? null;

  return recruiterDetails;
};

const collectExtractedJob = (): ExtractedLinkedInJob => {
  const jobType = extractJobType();
  const companyDetails = getCompanyDetails();
  const secondLiText =
    document
      .querySelectorAll(".job-details-jobs-unified-top-card__job-insight")?.[1]
      ?.textContent?.trim() ?? "";

  return {
    postUrl: window?.location?.href ?? null,
    title: extractTitle(),
    companyName: extractCompanyName() || companyDetails?.name || null,
    location: extractLocation(),
    postedDate: extractPostedDate(),
    description: extractDescription(),
    jobType,
    employment: jobType,
    jobOverview: secondLiText ? [secondLiText] : jobType ? [jobType] : null,
    easyApply: extractEasyApply(),
    source: "linkedin",
    companyDetails,
    recruiterDetails: getHiringTeamDetails(),
  };
};

export const getContentFromLinkedInJobs = async (
  setPostUrl?,
  clearStateAndCity?,
  setJobstitle?,
  setJobDescription?,
  // isDateString?,
  setPostedDate?,
  setEasyApply?,
  setJobType?,
  setEmployment?,
  setSource?,
  setCompanyName?,
  setCompanyDetails?,
  setRecruiterDetails?,
  setJoboverview?,
  setLocation?,
): Promise<void> => {
  try {
    clearStateAndCity?.();

    const ready = await waitForJobPanel();
    // console.log("LinkedIn job panel ready::", ready, {
    //   sduiRoot: !!getSduiRoot(),
    //   aboutJob: !!document.querySelector('[id^="JobDetails_AboutTheJob_"]'),
    //   expandable: !!document.querySelector(
    //     '[data-testid="expandable-text-box"]',
    //   ),
    //   jobViewLink: !!document.querySelector('a[href*="/jobs/view/"]'),
    // });

    // Give lazy About-the-job section a moment to hydrate
    await sleep(400);
    expandJobDescription();
    await sleep(200);

    let extracted = collectExtractedJob();

    // Retry description once if still missing (lazy section)
    if (!extracted.description) {
      await sleep(800);
      expandJobDescription();
      await sleep(200);
      extracted = collectExtractedJob();
    }

    // console.log("LinkedIn extracted job data::", isDateString);
    console.log("LinkedIn job description text::", extracted);

    setPostUrl?.(extracted.postUrl);
    setJobstitle?.(extracted.title);
    setCompanyName?.(extracted.companyName);
    setLocation?.(extracted.location);
    setPostedDate?.(extracted.postedDate);
    setJobDescription?.(extracted.description);
    setJoboverview?.(extracted.jobOverview);
    setJobType?.(extracted.jobType);
    setEmployment?.(extracted.employment);
    setEasyApply?.(extracted.easyApply);
    setSource?.(extracted.source);
    setCompanyDetails?.(extracted.companyDetails ?? {});
    setRecruiterDetails?.(extracted.recruiterDetails ?? {});
  } catch (error) {
    // console.log("LinkedIn extraction error::", error);
  }
};
