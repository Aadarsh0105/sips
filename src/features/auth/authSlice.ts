import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginAPI, resendLoginOtpAPI, verifyLoginOtpAPI } from "./authAPI";

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

export interface LoginOtpRequest {
  otpRequired: true;
  requestId: string;
  maskedMobile: string;
  expiresIn: number;
  channel: string;
}

type LoginResult = AuthSession | LoginOtpRequest;

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: AuthRole | null;
  loading: boolean;
  error: string | null;
  otpRequest: LoginOtpRequest | null;
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
  otpRequest: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    payload: { mobile: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await loginAPI(payload);
      const result = response?.data?.data ?? response?.data;

      if (result?.otpRequired && result?.requestId) {
        return result as LoginOtpRequest;
      }

      if (!result?.token || !result?.user) {
        return rejectWithValue("Login response was invalid.");
      }

      return result as AuthSession;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Login failed. Please try again."
      );
    }
  }
);

export const verifyLoginOtp = createAsyncThunk(
  "auth/verifyLoginOtp",
  async (payload: { requestId: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await verifyLoginOtpAPI(payload);
      const session = response?.data?.data ?? response?.data;
      if (!session?.token || !session?.user) {
        return rejectWithValue("OTP verification response was invalid.");
      }
      return session as AuthSession;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "OTP verification failed. Please try again.");
    }
  }
);

export const resendLoginOtp = createAsyncThunk(
  "auth/resendLoginOtp",
  async (payload: { requestId: string }, { rejectWithValue }) => {
    try {
      const response = await resendLoginOtpAPI(payload);
      const data = response?.data?.data ?? response?.data ?? {};
      return {
        otpRequired: true,
        requestId: data.requestId ?? payload.requestId,
        maskedMobile: data.maskedMobile ?? "",
        expiresIn: Number(data.expiresIn ?? 300),
        channel: data.channel ?? "whatsapp",
      } as LoginOtpRequest;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to resend OTP. Please try again.");
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
      state.otpRequest = null;
      localStorage.removeItem(storageKey);
    },
    resetOtp(state) {
      state.otpRequest = null;
      state.error = null;
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
        const result = action.payload as LoginResult;
        if ("otpRequired" in result) {
          state.otpRequest = result;
          return;
        }
        if (!result?.user || !result?.token) {
          state.error = "Login response was invalid.";
          state.user = null;
          state.token = null;
          state.role = null;
          return;
        }
        state.user = result.user;
        state.token = result.token;
        state.role = result.user.role;
        state.otpRequest = null;
        localStorage.setItem(storageKey, JSON.stringify(result));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Login failed. Please try again.";
      })
      .addCase(verifyLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        state.otpRequest = null;
        localStorage.setItem(storageKey, JSON.stringify(action.payload));
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "OTP verification failed.";
      })
      .addCase(resendLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpRequest = {
          ...action.payload,
          maskedMobile: action.payload.maskedMobile || state.otpRequest?.maskedMobile || "",
        };
      })
      .addCase(resendLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unable to resend OTP.";
      });
  },
});

export const { logout, resetOtp } = authSlice.actions;

export default authSlice.reducer;
