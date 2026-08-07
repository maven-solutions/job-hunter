import { getAiSiteHandler } from "../../autofill/ai/registry";
import {
  AiFormElement,
  RequestFieldAnswerFn,
} from "../../autofill/ai/types";
import { Applicant } from "../../autofill/data";
import { getJobApplicationFillWithAi } from "../../store/features/scanHtmlWithAi/ScanHtmlWithAiApi";
import { AppDispatch } from "../../store/store";

type ResumeWithId = { id?: string | number };

export type AiAutofillPhase = "idle" | "scanning" | "analysing" | "autofilling";

export const AI_AUTOFILL_LOADING_TEXT: Record<
  Exclude<AiAutofillPhase, "idle">,
  string
> = {
  scanning: "Scanning Page",
  analysing: "Analysing With AI",
  autofilling: "Autofilling",
};

export const getSelectedResumeAndUserIds = (
  userResumeList: ResumeWithId[] | undefined | null,
  resumeIndex: number,
  selectedUserId: string | number | null | undefined,
): { resumeId: string; userId: string } => {
  const selectedResume = userResumeList?.[resumeIndex];
  const resumeId = selectedResume?.id != null ? String(selectedResume.id) : "";
  const userId = selectedUserId != null ? String(selectedUserId) : "";

  if (!resumeId || !userId) {
    throw new Error("Select a user and resume before scanning.");
  }

  return { resumeId, userId };
};

export type ScanHtmlToMakeApiParams = {
  dispatch: AppDispatch;
  token: string;
  userResumeList: ResumeWithId[] | undefined | null;
  resumeIndex: number;
  selectedUserId: string | number | null | undefined;
  applicantData: Applicant | any;
  setAiAutofillPhase: (phase: AiAutofillPhase) => void;
};

export type ScanHtmlToMakeApiResult = {
  fieldsDetected: number;
  fieldsFilled: number;
};

const normalizeLabelKey = (label: string): string =>
  label.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Pull a single field answer from a job-application-fill API response.
 */
export const extractAnswerFromFillResponse = (
  response: unknown,
  fieldLabel: string,
): string | null => {
  if (response == null) return null;

  let payload: any = response;
  if (payload?.data != null && typeof payload.data === "object") {
    payload = payload.data;
  }
  if (
    payload?.fill_data_list != null &&
    typeof payload.fill_data_list === "object"
  ) {
    payload = payload.fill_data_list;
  }

  const items: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.elements)
      ? payload.elements
      : Array.isArray(payload?.answers)
        ? payload.answers
        : Array.isArray(payload?.fields)
          ? payload.fields
          : [];

  if (items.length === 0) return null;

  const target = normalizeLabelKey(fieldLabel);
  const match =
    items.find((item) => {
      const label = String(item?.label ?? item?.field ?? item?.name ?? "");
      return label === fieldLabel || normalizeLabelKey(label) === target;
    }) ?? items[0];

  const answer = String(
    match?.answer ?? match?.value ?? match?.fill ?? match?.text ?? "",
  ).trim();

  return answer || null;
};

/**
 * Builds a requestFieldAnswer callback that posts a one-element payload
 * to getJobApplicationFillWithAi (same API as the full-page scan).
 */
export const createRequestFieldAnswer = ({
  dispatch,
  token,
  resumeId,
  userId,
  source,
}: {
  dispatch: AppDispatch;
  token: string;
  resumeId: string;
  userId: string;
  source: string;
}): RequestFieldAnswerFn => {
  return async (element: AiFormElement): Promise<string | null> => {
    const payload = {
      elements: [element],
      token: token ?? "",
      url: window.location.href,
      parser: "internal",
      source,
      fromAgent: false,
      resumeId,
      userId,
    };

    const fillResponse = await dispatch(
      getJobApplicationFillWithAi(payload),
    ).unwrap();

    return extractAnswerFromFillResponse(
      fillResponse?.data?.fill_data_list ?? fillResponse?.data ?? fillResponse,
      element.label,
    );
  };
};

/**
 * Shared AI autofill pipeline (phase transitions + API call).
 * Site-specific DOM scan / fill is delegated to the matched AiSiteHandler.
 *
 * Also wires per-field icon buttons so each click hits the AI fill API
 * with a single-element payload (not local applicant context).
 */
export const scanHtmlToMakeApi = async ({
  dispatch,
  token,
  userResumeList,
  resumeIndex,
  selectedUserId,
  applicantData,
  setAiAutofillPhase,
}: ScanHtmlToMakeApiParams): Promise<ScanHtmlToMakeApiResult> => {
  const handler = getAiSiteHandler();
  if (!handler) {
    console.warn(
      "[CareerAI ScanAPI] AI autofill is not supported on this site.",
    );
    return { fieldsDetected: 0, fieldsFilled: 0 };
  }

  setAiAutofillPhase("scanning");
  let fieldsDetected = 0;
  let fieldsFilled = 0;

  try {
    const { resumeId, userId } = getSelectedResumeAndUserIds(
      userResumeList,
      resumeIndex,
      selectedUserId,
    );

    const requestFieldAnswer = createRequestFieldAnswer({
      dispatch,
      token: token ?? "",
      resumeId,
      userId,
      source: handler.id,
    });

    // Site-specific prep before scan (e.g. Workday fills Country, waits for layout).
    if (handler.prepareBeforeScan) {
      await handler.prepareBeforeScan(applicantData);
    }

    // Field icons use the same AI API for single-field refills.
    const iconCount =
      handler.initFieldScanner?.(applicantData, { requestFieldAnswer }) ?? 0;

    const payload = await handler.buildScanPayload({
      token: token ?? "",
      resumeId,
      userId,
      fromAgent: false,
      parser: "internal",
      applicantData,
    });

    fieldsDetected =
      payload.elements?.length > 0 ? payload.elements.length : iconCount;

    setAiAutofillPhase("analysing");
    const fillResponse = await dispatch(
      getJobApplicationFillWithAi(payload),
    ).unwrap();

    setAiAutofillPhase("autofilling");
    const fillResult = await handler.applyFill(
      fillResponse?.data?.fill_data_list ?? fillResponse?.data ?? fillResponse,
      applicantData,
    );
    fieldsFilled = fillResult.filled;
  } catch (error) {
    console.error(`[CareerAI ScanAPI:${handler.id}]`, error);
  } finally {
    setAiAutofillPhase("idle");
  }

  return { fieldsDetected, fieldsFilled };
};
