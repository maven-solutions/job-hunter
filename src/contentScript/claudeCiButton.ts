const CI_BUTTON_ID = "careerai-claude-ci-button";
const PROMPT_MARKER = "CareerAI job payload";

const JOB_JSON_PROMPT = `

Also format the result as a ${PROMPT_MARKER}.

Return ONLY one JSON object (no markdown code fences, no extra text) with this exact shape and keys:

{
  "companyName": "string",
  "jobTitle": "string",
  "jobLink": "https://...",
  "posted_on": "YYYY-MM-DD",
  "description": "<strong>About the company</strong><br><br>Full HTML job description using <strong> and <br> tags",
  "jobType": "remote | on-site | hybrid",
  "category": "product owner | scrum master | project manager | business analyst | agile coach | product manager | clinical research | program manager",
  "employment": "part-time | full-time | contract",
  "jobBoard": "linkedin | indeed | dice | ziprecruiter | glassdoor | simplyhired | builtin",
  "state": "USA",
  "easyApply": 1,
  "recruiterDetails": {},
  "companyDetails": {
    "link": "https://...",
    "name": "string",
    "logo": "https://...",
    "description": "string"
  },
  "jobOverview": ["Full-time"],
  "location": "City, Region, Country"
}

Field rules:
- Use a real, currently posted job that matches the request above.
- jobLink must be the actual public job URL.
- posted_on must be ISO date YYYY-MM-DD.
- description must be HTML (not markdown). Keep <strong> and <br>.
- jobType must be one of: remote, on-site, hybrid.
- category must be one of the values listed above; pick the closest match.
- employment must be one of: part-time, full-time, contract.
- jobBoard must be the source site (lowercase).
- easyApply: 1 if Easy Apply / 1-click apply, otherwise 0.
- Fill companyDetails from the posting when available; otherwise use empty strings.
- recruiterDetails can be {} if unknown.
`;

const isClaudePage = () => window.location.hostname.includes("claude.ai");

const getChatInput = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-testid="chat-input"]');

const getComposer = (): HTMLElement | null => {
  const editor = getChatInput();
  return (
    editor?.closest<HTMLElement>("fieldset") ||
    document.querySelector<HTMLElement>('[data-perf-region="composer"]')
  );
};

const moveCaretToEnd = (editor: HTMLElement) => {
  editor.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const insertTextIntoEditor = (editor: HTMLElement, text: string) => {
  moveCaretToEnd(editor);

  try {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData,
    });
    editor.dispatchEvent(pasteEvent);
    if (editor.innerText?.includes(PROMPT_MARKER)) {
      return;
    }
  } catch (error) {}

  document.execCommand("insertText", false, text);
};

const appendPromptToClaudeInput = () => {
  const editor = getChatInput();
  if (!editor) return;

  const existingText = editor.innerText?.trim() ?? "";
  if (existingText.includes(PROMPT_MARKER)) {
    editor.focus();
    return;
  }

  const prefix = existingText ? "\n\n" : "";
  insertTextIntoEditor(editor, `${prefix}${JOB_JSON_PROMPT.trim()}`);
  editor.focus();
};

const createCiButton = () => {
  const wrap = document.createElement("div");
  wrap.className = "careerai-claude-ci-wrap";

  const button = document.createElement("button");
  button.id = CI_BUTTON_ID;
  button.type = "button";
  button.className = "careerai-claude-ci-btn";
  button.textContent = "CI";
  button.setAttribute("aria-label", "Append CareerAI job JSON prompt");
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    appendPromptToClaudeInput();
  });

  wrap.appendChild(button);
  return wrap;
};

export const addCiButtonToClaude = () => {
  if (!isClaudePage()) return;
  if (document.getElementById(CI_BUTTON_ID)) return;

  const composer = getComposer();
  if (!composer) return;

  const buttonWrap = createCiButton();
  const composerBox = composer.querySelector<HTMLElement>(":scope > .relative");

  if (composerBox) {
    composer.insertBefore(buttonWrap, composerBox);
  } else {
    composer.prepend(buttonWrap);
  }
};
