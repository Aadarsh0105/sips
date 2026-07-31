import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginAPI } from "./authAPI";

export type AuthRole = "ADMIN" | "RECEPTIONIST";

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: AuthRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: AuthRole | null;
  loading: boolean;
  error: string | null;
}

const storageKey = "authSession";

const loadSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
};

const initialSession = loadSession();

const initialState: AuthState = {
  user: initialSession?.user ?? null,
  token: initialSession?.token ?? null,
  role: initialSession?.user.role ?? null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    payload: { mobile: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await loginAPI(payload);
      const session = response?.data?.data ?? response?.data;

      if (!session?.token || !session?.user) {
        return rejectWithValue("Login response was invalid.");
      }

      return session as AuthSession;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Login failed. Please try again."
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.role = null;
      state.error = null;
      localStorage.removeItem(storageKey);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload?.user || !action.payload?.token) {
          state.error = "Login response was invalid.";
          state.user = null;
          state.token = null;
          state.role = null;
          return;
        }
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        localStorage.setItem(storageKey, JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Login failed. Please try again.";
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
