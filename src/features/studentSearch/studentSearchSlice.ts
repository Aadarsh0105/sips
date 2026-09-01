import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { API } from "../../api/endpoints";

export interface StudentSearchResult {
  id?: string;
  _id?: string;
  studentId: string;
  admissionNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  email: string;
  gender: string;
  dob: string;
  className: string;
  section: string;
  address: string;
  totalFee: number;
  paidFee: number;
  dueFee: number;
  lumpSumPreview?: {
    studentId: string;
    name: string;
    feeDiscountType: string;
    paymentType: string;
    eligible: boolean;
    discountType: string;
    monthlyDiscountPercentage: number;
    remainingMonths: number;
    normalMonthlyFee: number;
    lumpSumMonthlyFee: number;
    remainingMonthlyAmount: number;
    remainingOneTimeFees: number;
    remainingAcademicFee: number;
    additionalDiscount: number;
    lumpSumAmount: number;
  } | null;
  status: string;
  isDeleted: boolean;
  createdBy: string;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface StudentSearchState {
  student: StudentSearchResult[] | null;
  otpRequest: PublicStudentSearchOtpRequest | null;
  loading: boolean;
  error: string | null;
}

export interface PublicStudentSearchOtpRequest {
  requestId: string;
  maskedMobile: string;
  expiresIn: number;
  channel: string;
}

const initialState: StudentSearchState = {
  student: null,
  otpRequest: null,
  loading: false,
  error: null,
};

export const searchStudent = createAsyncThunk(
  "studentSearch/searchStudent",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API.STUDENTS}/search?search=${encodeURIComponent(query)}`);
      return (response.data?.data ?? []) as StudentSearchResult[];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to find student"
      );
    }
  }
);

export const requestPublicStudentSearchOtp = createAsyncThunk(
  "studentSearch/requestPublicStudentSearchOtp",
  async (search: string, { rejectWithValue }) => {
    try {
      const response = await api.post(API.PUBLIC_STUDENT_SEARCH_REQUEST_OTP, { search });
      const data = response.data?.data;
      if (!data?.requestId) return rejectWithValue("OTP request response was invalid.");
      return {
        requestId: data.requestId,
        maskedMobile: data.maskedMobile ?? "your registered mobile number",
        expiresIn: Number(data.expiresIn ?? 300),
        channel: data.channel ?? "whatsapp",
      } as PublicStudentSearchOtpRequest;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to send search OTP");
    }
  }
);

export const verifyPublicStudentSearchOtp = createAsyncThunk(
  "studentSearch/verifyPublicStudentSearchOtp",
  async (payload: { requestId: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(API.PUBLIC_STUDENT_SEARCH_VERIFY_OTP, payload);
      const data = response.data?.data ?? [];
      return (Array.isArray(data) ? data : [data]) as StudentSearchResult[];
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to verify search OTP");
    }
  }
);

const studentSearchSlice = createSlice({
  name: "studentSearch",
  initialState,
  reducers: {
    clearStudentSearch(state) {
      state.student = null;
      state.otpRequest = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.student = action.payload;
      })
      .addCase(searchStudent.rejected, (state, action) => {
        state.loading = false;
        state.student = null;
        state.error = (action.payload as string) ?? "Unable to find student";
      })
      .addCase(requestPublicStudentSearchOtp.pending, (state) => {
        state.loading = true;
        state.student = null;
        state.error = null;
      })
      .addCase(requestPublicStudentSearchOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpRequest = action.payload;
      })
      .addCase(requestPublicStudentSearchOtp.rejected, (state, action) => {
        state.loading = false;
        state.otpRequest = null;
        state.error = (action.payload as string) ?? "Unable to send search OTP";
      })
      .addCase(verifyPublicStudentSearchOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPublicStudentSearchOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.student = action.payload;
        state.otpRequest = null;
      })
      .addCase(verifyPublicStudentSearchOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unable to verify search OTP";
      });
  },
});

export const { clearStudentSearch } = studentSearchSlice.actions;

export default studentSearchSlice.reducer;
