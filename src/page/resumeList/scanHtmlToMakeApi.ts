import { getAiSiteHandler } from "../../autofill/ai/registry";
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

/**
 * Shared AI autofill pipeline (phase transitions + API call).
 * Site-specific DOM scan / fill is delegated to the matched AiSiteHandler.
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

    const payload = await handler.buildScanPayload({
      token: token ?? "",
      resumeId,
      userId,
      fromAgent: false,
      parser: "internal",
    });

    fieldsDetected = payload.elements?.length ?? 0;

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
