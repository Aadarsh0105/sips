import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.ts";
import studentSearchReducer from "../features/studentSearch/studentSearchSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import studentsReducer from "../features/students/studentsSlice";
import receptionistsReducer from "../features/receptionists/receptionistsSlice";
import feeStructuresReducer from "../features/feeStructures/feeStructuresSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    studentSearch: studentSearchReducer,
    dashboard: dashboardReducer,
    students: studentsReducer,
    receptionists: receptionistsReducer,
    feeStructures: feeStructuresReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
