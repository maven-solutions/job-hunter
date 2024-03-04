import { configureStore } from "@reduxjs/toolkit";
import thunkMiddleware from "redux-thunk";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import RootReducer from "./rootReducer";

const Store = configureStore({
  reducer: RootReducer,
});

export type RootStore = ReturnType<typeof RootReducer>;

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default Store;
