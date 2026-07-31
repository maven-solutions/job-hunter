import { combineReducers } from "redux";
import AuthSlice from "./features/Auth/AuthSlice";
import JobDetailSlice from "./features/JobDetail/JobDetailSlice";
import ResumeListSlice from "./features/ResumeList/ResumeListSlice";
import OrgSlice from "./features/Organization/OrgSlice";
import ApplicantSlice from "./features/applicant/ApplicantSlice";
import ScanHtmlWithAiSlice from "./features/scanHtmlWithAi/ScanHtmlWithAiSlice";

const RootReducer = combineReducers({
  AuthSlice: AuthSlice,
  JobDetailSlice: JobDetailSlice,
  ResumeListSlice: ResumeListSlice,
  OrgSlice: OrgSlice,
  ApplicantSlice: ApplicantSlice,
  ScanHtmlWithAiSlice: ScanHtmlWithAiSlice,
});

export default RootReducer;
