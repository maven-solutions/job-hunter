Add **Autofill with AI** for a new website, following the **same architecture, business flow, and naming conventions** as Greenhouse.

Do **not** rewrite the shared UI or shared pipeline. Only add domain-specific site code and register it.

---

### What I will provide

1. **Website / domain** (example: `jobs.ashbyhq.com`)
2. **HTML of the application form** (and any relevant dropdown/menu HTML if needed)

Replace placeholders:

- `{{SITE_NAME}}` → short name, PascalCase (e.g. `Ashby`, `Lever`, `Workday`)
- `{{SITE_ID}}` → lowercase id for API `source` (e.g. `ashby`, `lever`)
- `{{HOST_MATCHERS}}` → hosts where this runs (e.g. `jobs.ashbyhq.com`)
- Paste the form HTML after the prompt

---

### Shared code (DO NOT break / DO NOT duplicate)

These already work for all sites:

| Piece              | Path / symbol                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Button + phases UI | `src/page/resumeList/ResumeListForVA.v2.tsx` — `isAiAutofillSupported()`, `handleScanAndAutofillWithAi` |
| Shared pipeline    | `src/page/resumeList/scanHtmlToMakeApi.ts` — phases: scanning → analysing → autofilling                 |
| API call           | `getJobApplicationFillWithAi` (unchanged payload shape)                                                 |
| Handler contract   | `src/autofill/ai/types.ts` — `AiSiteHandler`                                                            |
| Registry           | `src/autofill/ai/registry.ts` — register new handler here                                               |

**Business flow (same for every site):**

1. Resolve handler via `getAiSiteHandler()` (URL match)
2. Optional `initFieldScanner(applicantData)` → mark fields / show icons, return count
3. `buildScanPayload({ token, resumeId, userId, fromAgent, parser })` → build payload from live DOM
4. Send payload to AI API
5. `applyFill(fill_data_list, applicantData)` → fill form from AI answers
6. Upload resume from `applicantData.pdf_url` (not from API) using existing file-upload patterns (`fileTypeDataFiller` / site-specific file input) when a resume input exists
7. Return `{ fieldsDetected, fieldsFilled }` for UI stats

**Payload element shape (must match Greenhouse / API):**

```ts
{
  label: string;
  required: boolean;
  type: "text" | "search";  // text/textarea → "text"; select/combobox/dropdown → "search" + options[]
  options?: string[];
}
// plus token, url, parser, source: "{{SITE_ID}}", fromAgent, resumeId, userId
```

---

### Reference implementation (Greenhouse)

Mirror this structure and quality:

```
src/autofill/ai/
├── types.ts
├── registry.ts
├── sites/greenhouse.ts
├── scan.greenhouse.ts
├── autofill.greenhouse.ts
└── cibtn.greenhouse.ts
```

Read these before coding:

- `src/autofill/ai/sites/greenhouse.ts`
- `src/autofill/ai/scan.greenhouse.ts`
- `src/autofill/ai/autofill.greenhouse.ts`
- `src/autofill/ai/cibtn.greenhouse.ts`
- `src/autofill/ai/types.ts`
- `src/autofill/ai/registry.ts`
- `src/page/resumeList/scanHtmlToMakeApi.ts`
- `src/page/resumeList/ResumeListForVA.v2.tsx`
- Resume upload: `src/autofill/FromFiller/fileTypeDataFiller.ts`

---

### Files to CREATE for `{{SITE_NAME}}`

| File                                   | Purpose                                      | Naming convention (example for Ashby)                                                                                          |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/autofill/ai/scan.{{site}}.ts`     | Read DOM → build API payload                 | `scanAshbyHtmlToMakeApiPayload`, `collectAshbyCandidateFields`, types `AshbyScanToMakeApiPayload`, `AshbyScanToMakeApiOptions` |
| `src/autofill/ai/autofill.{{site}}.ts` | Apply AI answers to form                     | `autofillAshbyWithAi`, `normalizeAshbyAiAnswers`                                                                               |
| `src/autofill/ai/cibtn.{{site}}.ts`    | Grammarly-style field icons scanner          | `initAshbyHtmlScanner`, `removeAshbyHtmlScannerIcons`, `getAshbyScannedFieldCount`                                             |
| `src/autofill/ai/sites/{{site}}.ts`    | Wire handler: matches + scan + fill + resume | `ashbyAiHandler`, `isAshbyUrl`                                                                                                 |

### Files to UPDATE

- `src/autofill/ai/registry.ts` — import and **register** the new handler in `AI_SITE_HANDLERS` (first match wins)
- Do **not** hardcode the site inside `ResumeListForVA.v2.tsx` or `scanHtmlToMakeApi.ts` (they already use the registry)

---

### Naming convention (strict)

Site name must appear in **all** site-specific exports:

| Pattern           | Greenhouse example                   | Your site example                       |
| ----------------- | ------------------------------------ | --------------------------------------- |
| Init icon scanner | `initGreenhouseHtmlScanner`          | `init{{SITE_NAME}}HtmlScanner`          |
| Build payload     | `scanGreenhouseHtmlToMakeApiPayload` | `scan{{SITE_NAME}}HtmlToMakeApiPayload` |
| Collect fields    | `collectGreenhouseCandidateFields`   | `collect{{SITE_NAME}}CandidateFields`   |
| Autofill apply    | `autofillGreenhouseWithAi`           | `autofill{{SITE_NAME}}WithAi`           |
| Handler           | `greenhouseAiHandler`                | `{{siteId}}AiHandler`                   |
| Match helper      | `isGreenhouseBoardsUrl`              | `is{{SITE_NAME}}Url`                    |
| Files             | `*.greenhouse.ts`                    | `*.{{siteId}}.ts`                       |

Shared names stay generic (`AiSiteHandler`, `scanHtmlToMakeApi`, `isAiAutofillSupported`).

---

### What `scan.{{site}}.ts` must do

From the provided HTML / live DOM:

1. Find autofillable fields on the **host page** (not inside our extension root `#careerai…`)
2. Support:
   - `input` (text, email, tel, url, number, etc.) — skip hidden/file/submit/password/checkbox/radio when same as Greenhouse policy unless HTML requires them
   - `textarea`
   - native `select` → type `"search"` + full option labels
   - custom dropdowns / comboboxes / listboxes → open if needed, collect options, close; type `"search"` + `options`
3. Resolve human-readable **label** (label[for], aria-label, aria-labelledby, nearby wrapper label)
4. Detect **required** (required / aria-required / asterisk in label)
5. Include **Phone Country Code** (or equivalent) when present, with options if available
6. Optimize: avoid long fixed sleeps for dropdowns; prefer MutationObserver / short settles (same approach as Greenhouse)
7. Set `source: "{{SITE_ID}}"`

### What `autofill.{{site}}.ts` must do

1. Normalize AI response into `{ label, answer }[]` (handle array / nested / map shapes like Greenhouse)
2. Match answers to DOM fields by label (exact + normalized)
3. Fill reliably for this site’s UI:
   - text/textarea inputs (value + change/input events)
   - native selects
   - custom comboboxes / flyouts / listboxes for this ATS
4. Return `{ total, filled, failed, skipped }`

### What `cibtn.{{site}}.ts` must do

1. Scan autofillable fields on this site
2. Attach small field icons (reuse Greenhouse icon UX/CSS ideas if useful, scoped to this site)
3. `init{{SITE_NAME}}HtmlScanner(applicantData)` returns field count

### What `sites/{{site}}.ts` must do

Implement `AiSiteHandler`:

```ts
{
  id: "{{SITE_ID}}",
  matches: (url) => /* only {{HOST_MATCHERS}} */,
  initFieldScanner: init{{SITE_NAME}}HtmlScanner,
  buildScanPayload: scan{{SITE_NAME}}HtmlToMakeApiPayload,
  applyFill: async (fillData, applicantData) => {
    const result = await autofill{{SITE_NAME}}WithAi(fillData);
    // upload resume from applicantData.pdf_url when file input exists
    return result;
  }
}
```

---

### Constraints

- Same button / loading text / stats UI — no second button
- Target only `{{HOST_MATCHERS}}` (and stated subdomains); do not enable site-wide casually
- Prefer targeted edits; no broad refactors of Greenhouse or other ATS
- Do not touch `dist/` or `node_modules/`
- Preserve existing styles/patterns near related files
- If HTML is incomplete for custom selects, implement best-effort and note what else is needed

---

### Deliverables checklist

- [ ] Site files created with correct naming
- [ ] Handler registered in `registry.ts`
- [ ] Button appears only on matching host(s)
- [ ] Payload scan works for inputs / textareas / selects / custom dropdowns
- [ ] AI answers applied to form
- [ ] Resume upload via `applicantData.pdf_url` when resume file input exists
- [ ] Field count / filled stats still update in UI

---

### Input for this run

- **Site name:** `{{SITE_NAME}}` / id `{{SITE_ID}}`
- **Hosts:** `{{HOST_MATCHERS}}`
- **Form HTML:**  
  _(paste here)_

---
