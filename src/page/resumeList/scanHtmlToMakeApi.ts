import { scanHtmlToMakeApiPayload } from "../../autofill/ai/scan.greenhouse";
import { autofillGreenhouseWithAi } from "../../autofill/ai/autofill.greenhouse";
import { getJobApplicationFillWithAi } from "../../store/features/scanHtmlWithAi/ScanHtmlWithAiApi";
import { AppDispatch } from "../../store/store";

type ResumeWithId = { id?: string | number };

export type AiAutofillPhase =
  | "idle"
  | "scanning"
  | "analysing"
  | "autofilling";

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
  const resumeId =
    selectedResume?.id != null ? String(selectedResume.id) : "";
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
  setAiAutofillPhase: (phase: AiAutofillPhase) => void;
};

export type ScanHtmlToMakeApiResult = {
  fieldsDetected: number;
  fieldsFilled: number;
};

export const scanHtmlToMakeApi = async ({
  dispatch,
  token,
  userResumeList,
  resumeIndex,
  selectedUserId,
  setAiAutofillPhase,
}: ScanHtmlToMakeApiParams): Promise<ScanHtmlToMakeApiResult> => {
  setAiAutofillPhase("scanning");
  let fieldsDetected = 0;
  let fieldsFilled = 0;

  try {
    const { resumeId, userId } = getSelectedResumeAndUserIds(
      userResumeList,
      resumeIndex,
      selectedUserId,
    );

    const payload = await scanHtmlToMakeApiPayload({
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
    if (
      payload.source === "greenhouse" ||
      window.location.href.toLowerCase().includes("greenhouse")
    ) {
      const fillResult = await autofillGreenhouseWithAi(
        fillResponse.data.fill_data_list,
      );
      fieldsFilled = fillResult.filled;
    }
  } catch (error) {
    console.error("[CareerAI ScanAPI]", error);
  } finally {
    setAiAutofillPhase("idle");
  }

  return { fieldsDetected, fieldsFilled };
};
