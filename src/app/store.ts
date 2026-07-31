import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.ts";
import studentSearchReducer from "../features/studentSearch/studentSearchSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    studentSearch: studentSearchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
