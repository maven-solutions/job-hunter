import { scanHtmlToMakeApiPayload } from "../../autofill/ai/scan.greenhouse";
import { autofillGreenhouseWithAi } from "../../autofill/ai/autofill.greenhouse";
import { getJobApplicationFillWithAi } from "../../store/features/scanHtmlWithAi/ScanHtmlWithAiApi";
import { AppDispatch } from "../../store/store";

type ResumeWithId = { id?: string | number };

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
  setScanApiLoading: (loading: boolean) => void;
};

export const scanHtmlToMakeApi = async ({
  dispatch,
  token,
  userResumeList,
  resumeIndex,
  selectedUserId,
  setScanApiLoading,
}: ScanHtmlToMakeApiParams): Promise<void> => {
  setScanApiLoading(true);
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

    const fillResponse = await dispatch(
      getJobApplicationFillWithAi(payload),
    ).unwrap();

    if (
      payload.source === "greenhouse" ||
      window.location.href.toLowerCase().includes("greenhouse")
    ) {
      await autofillGreenhouseWithAi(fillResponse.data.fill_data_list);
    }
  } catch (error) {
    console.error("[CareerAI ScanAPI]", error);
  } finally {
    setScanApiLoading(false);
  }
};
