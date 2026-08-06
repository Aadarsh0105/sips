import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { API } from "../../api/endpoints";

export interface StudentSearchResult {
  _id: string;
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
  status: string;
  isDeleted: boolean;
  createdBy: string;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface StudentSearchState {
  student: StudentSearchResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: StudentSearchState = {
  student: null,
  loading: false,
  error: null,
};

export const searchStudent = createAsyncThunk(
  "studentSearch/searchStudent",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API.STUDENTS}/search?search=${encodeURIComponent(query)}`);
      return response.data?.data as StudentSearchResult;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to find student"
      );
    }
  }
);

const studentSearchSlice = createSlice({
  name: "studentSearch",
  initialState,
  reducers: {
    clearStudentSearch(state) {
      state.student = null;
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
      });
  },
});

export const { clearStudentSearch } = studentSearchSlice.actions;

export default studentSearchSlice.reducer;
