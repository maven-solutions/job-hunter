/**
 * My Experience section boundary.
 * Full scan/expand logic lives in scan.workday.ts (shared DOM helpers).
 * Use this module only for page detection isolation — experience edits
 * should stay under Experience-related symbols in scan.workday.ts.
 */
export { isWorkdayMyExperiencePage } from "../detect";
