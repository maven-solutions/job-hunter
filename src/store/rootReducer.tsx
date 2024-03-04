import { combineReducers } from "redux";
import AuthSlice from "./features/Auth/AuthSlice";
import JobDetailSlice from "./features/JobDetail/JobDetailSlice";

const RootReducer = combineReducers({
  AuthSlice: AuthSlice,
  JobDetailSlice: JobDetailSlice,
});

export default RootReducer;
