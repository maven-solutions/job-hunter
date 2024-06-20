import { combineReducers } from "redux";
import AuthSlice from "./features/Auth/AuthSlice";
import JobDetailSlice from "./features/JobDetail/JobDetailSlice";
import ResumeListSlice from "./features/ResumeList/ResumeListSlice";

const RootReducer = combineReducers({
  AuthSlice: AuthSlice,
  JobDetailSlice: JobDetailSlice,
  ResumeListSlice: ResumeListSlice,
});

export default RootReducer;
