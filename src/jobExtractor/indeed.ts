function removeJobPostSuffix(sentence: string): string {
  return sentence.replace(/- job post/gi, "").trim();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function textOf(el: Element | null | undefined): string {
  return normalizeText(el?.textContent);
}

function getJobRoot(): ParentNode {
  return (
    document.querySelector("#jobsearch-ViewjobPaneWrapper") ||
    document.querySelector('[data-testid="viewjob-main-content"]') ||
    document
  );
}

function firstText(root: ParentNode, selectors: string[]): string {
  for (const selector of selectors) {
    const text = textOf(root.querySelector(selector));
    if (text) return text;
  }
  return "";
}

function cleanCompanyAria(aria: string | null): string {
  return normalizeText(aria).replace(
    /\s*\(opens in a new (tab|window)\)\s*$/i,
    "",
  );
}

const EMPLOYMENT_OPTIONS: Record<string, { value: string; label: string }> = {
  "full-time": { value: "full-time", label: "Full-time" },
  "full time": { value: "full-time", label: "Full-time" },
  "part-time": { value: "part-time", label: "Part-time" },
  "part time": { value: "part-time", label: "Part-time" },
  contract: { value: "contract", label: "Contract" },
  contractor: { value: "contract", label: "Contract" },
};

const JOB_TYPE_OPTIONS: Record<string, { value: string; label: string }> = {
  remote: { value: "remote", label: "Remote" },
  hybrid: { value: "hybrid", label: "Hybrid" },
  "on-site": { value: "on-site", label: "On-site" },
  onsite: { value: "on-site", label: "On-site" },
  "in-person": { value: "on-site", label: "On-site" },
  "in person": { value: "on-site", label: "On-site" },
};

function matchEmployment(text: string) {
  return EMPLOYMENT_OPTIONS[text.toLowerCase()] ?? null;
}

function matchJobType(text: string) {
  return JOB_TYPE_OPTIONS[text.toLowerCase()] ?? null;
}

function extractTitle(root: ParentNode): string {
  const modern = firstText(root, [
    '[data-testid="vj-job-title"]',
    '[data-testid="vj-job-title-compact"]',
  ]);
  if (modern) return modern;

  const chrome = firstText(document, ['h2[data-testid="simpler-jobTitle"]']);
  if (chrome) return chrome;

  const edge = firstText(document, [
    '[data-testid="jobsearch-JobInfoHeader-title"]',
  ]);
  return edge ? removeJobPostSuffix(edge) : "";
}

function extractCompanyName(root: ParentNode): string {
  const link = root.querySelector(
    '[data-testid="company-info-metadata"] a, [data-testid="desktop-embedded-compact-header"] a',
  );
  const fromAria = cleanCompanyAria(link?.getAttribute("aria-label") ?? null);
  if (fromAria) return fromAria;

  const fromLink = textOf(link);
  if (fromLink) return fromLink;

  const metadata = root.querySelector('[data-testid="company-info-metadata"]');
  if (metadata) {
    const chunks = Array.from(metadata.querySelectorAll('[dir="ltr"]')).map(
      textOf,
    );
    for (const chunk of chunks) {
      if (!chunk || chunk === "•" || chunk === "·") continue;
      if (/^\d+(\.\d+)?$/.test(chunk)) continue;
      if (matchJobType(chunk)) continue;
      if (chunk.includes("•") || chunk.startsWith("$")) continue;
      return chunk;
    }
  }

  return firstText(document, [
    ".jobsearch-JobInfoHeader-companyNameLink",
    ".jobsearch-JobInfoHeader-companyNameSimple",
    '[data-testid="inlineHeader-companyName"]',
  ]);
}

function isSeparator(text: string): boolean {
  return /^[\s•·\u2022\u00b7\u2013\u2014-]+$/.test(text);
}

function parseLocationLine(raw: string): {
  location: string;
  jobType: { value: string; label: string } | null;
} {
  const parts = raw
    .split(/[•·\u2022\u00b7]/)
    .map((part) => part.trim())
    .filter((part) => part && !isSeparator(part));

  let jobType: { value: string; label: string } | null = null;
  const locationParts: string[] = [];

  for (const part of parts) {
    const workplace = matchJobType(part);
    if (workplace) {
      jobType = workplace;
    } else if (!part.startsWith("$")) {
      locationParts.push(part);
    }
  }

  return { location: locationParts.join(", "), jobType };
}

function extractLocation(root: ParentNode): {
  location: string;
  jobType: { value: string; label: string } | null;
} {
  const metadata = root.querySelector('[data-testid="company-info-metadata"]');
  if (metadata) {
    const rows = Array.from(metadata.querySelectorAll("div")).filter((div) => {
      const directTexts = Array.from(div.children).map((child) => textOf(child));
      return directTexts.some(
        (text) => text === "•" || text === "·" || !!matchJobType(text),
      );
    });
    const row = rows.sort((a, b) => textOf(a).length - textOf(b).length)[0];
    if (row) {
      const parsed = parseLocationLine(
        Array.from(row.children)
          .map((child) => textOf(child))
          .filter((text) => text && !isSeparator(text))
          .join(" • "),
      );
      if (parsed.location || parsed.jobType) return parsed;
    }
  }

  const compact = root.querySelector(
    '[data-testid="desktop-embedded-compact-header"]',
  );
  if (compact) {
    const line = Array.from(compact.querySelectorAll('[dir="ltr"]'))
      .map(textOf)
      .find(
        (text) =>
          text.includes("•") &&
          text.length > 1 &&
          !text.startsWith("$") &&
          !/a year|an hour|a month|a week/i.test(text),
      );
    if (line) return parseLocationLine(line);
  }

  const legacy = textOf(
    document.querySelector('[data-testid="inlineHeader-companyLocation"]'),
  );
  if (legacy) return parseLocationLine(legacy);

  return { location: "", jobType: null };
}

function extractEmployment(root: ParentNode) {
  const group = root.querySelector('[role="group"][aria-label="Job type"]');
  const labels = group
    ? Array.from(group.querySelectorAll("[dir='ltr'], [data-testid]")).map(
        (el) => textOf(el) || el.getAttribute("data-testid") || "",
      )
    : [];

  for (const label of labels) {
    const match = matchEmployment(label);
    if (match) return match;
  }

  const headerLabels = Array.from(
    root.querySelectorAll('[data-testid="desktop-job-header"] [dir="ltr"]'),
  ).map(textOf);
  for (const label of headerLabels) {
    const match = matchEmployment(label);
    if (match) return match;
  }

  return null;
}

function extractPay(root: ParentNode): string {
  const payGroup = root.querySelector('[role="group"][aria-label="Pay"]');
  if (payGroup) {
    const chip = Array.from(payGroup.querySelectorAll("[dir='ltr']"))
      .map(textOf)
      .find((text) => /^\$/.test(text) || /\b(a year|an hour|a month|a week|a day)\b/i.test(text));
    if (chip) return chip;
  }

  return (
    Array.from(
      root.querySelectorAll('[data-testid="desktop-job-header"] [dir="ltr"]'),
    )
      .map(textOf)
      .find((text) => /^\$/.test(text)) ?? ""
  );
}

function extractDescription(root: ParentNode): string {
  const modern =
    root.querySelector(".simple-job-description-html") ||
    root.querySelector(".react-native-html-content") ||
    document.getElementById("jobDescriptionText");
  if (!modern) return "";

  const clone = modern.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("style, script").forEach((node) => node.remove());
  return clone.innerHTML.trim();
}

function extractEasyApply(root: ParentNode) {
  const apply = root.querySelector('[data-testid="viewjob-apply"]');
  const label = normalizeText(
    `${textOf(apply)} ${apply?.getAttribute("aria-label") ?? ""}`,
  ).toLowerCase();
  if (!label) return null;
  if (/company site|company website/.test(label)) {
    return { value: 0, label: "Company" };
  }
  if (/easy apply|easily apply|apply now/.test(label)) {
    return { value: 1, label: "Easy Apply" };
  }
  return null;
}

export const getJobsFromIndeed = (
  setPostUrl,
  clearStateAndCity,
  setJobstitle,
  setJobDescription,
  setPostedDate,
  setEasyApply,
  setJobType,
  setEmployment,
  setSource,
  setCompanyName,
  setJoboverview,
  setLocation,
): void => {
  setPostUrl(window.location.href);
  clearStateAndCity();

  const root = getJobRoot();
  const { location, jobType } = extractLocation(root);
  const pay = extractPay(root);

  setJobstitle(extractTitle(root));
  setCompanyName(extractCompanyName(root));
  setLocation(location);
  setJobDescription(extractDescription(root));
  setJobType(jobType);
  setEmployment(extractEmployment(root));
  setJoboverview(pay ? [pay] : []);
  setPostedDate("n/a");
  setEasyApply(extractEasyApply(root));
  setSource("Indeed");
};
