import { ashbyAiHandler } from "./sites/ashby";
import { greenhouseAiHandler } from "./sites/greenhouse";
import { icimsAiHandler } from "./sites/icims";
import { workdayAiHandler } from "./sites/workday";
import { AiSiteHandler } from "./types";

/**
 * Register AI autofill site handlers here.
 *
 * To support a new ATS:
 * 1. Create `sites/<name>.ts` implementing AiSiteHandler
 * 2. Add it to this array (order matters — first match wins)
 *
 * Example:
 *   import { leverAiHandler } from "./sites/lever";
 *   const AI_SITE_HANDLERS = [greenhouseAiHandler, leverAiHandler];
 */
const AI_SITE_HANDLERS: AiSiteHandler[] = [
  greenhouseAiHandler,
  ashbyAiHandler,
  workdayAiHandler,
  icimsAiHandler,
  // leverAiHandler,
];

/** Resolve the site handler for a URL (defaults to current page). */
export const getAiSiteHandler = (
  url: string = window.location.href,
): AiSiteHandler | null =>
  AI_SITE_HANDLERS.find((handler) => handler.matches(url)) ?? null;

/** Whether "Autofill with AI" is available on this page. */
export const isAiAutofillSupported = (
  url: string = window.location.href,
): boolean => getAiSiteHandler(url) != null;

/** All registered handlers (for debugging / tests). */
export const listAiSiteHandlers = (): readonly AiSiteHandler[] =>
  AI_SITE_HANDLERS;
