import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginAPI } from "./authAPI";

export const login = createAsyncThunk(
  "auth/login",
  async (payload: any) => {
    return await loginAPI(payload);
  }
);