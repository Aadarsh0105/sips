import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { API } from "../../api/endpoints";

export interface StudentRecord {
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
  admissionDate?: string;
  feeStartDate?: string;
  admissionFee?: number;
  monthlyFee?: number;
  examFee?: number;
  sportFee?: number;
  computerFee?: number;
  functionFee?: number;
  smartClassFee?: number;
  otherCharges?: number;
  openingDue?: number;
  totalFee: number;
  paidFee: number;
  dueFee: number;
  lumpSumPaid?: boolean;
  status: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface StudentsState {
  items: StudentRecord[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: StudentsState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
};

export const fetchStudents = createAsyncThunk(
  "students/fetchStudents",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API.STUDENTS);
      return (response?.data?.data ?? response?.data ?? []) as StudentRecord[];
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to load students.");
    }
  }
);

export const fetchStudentById = createAsyncThunk(
  "students/fetchStudentById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API.STUDENTS}/${id}`);
      return response?.data?.data as StudentRecord;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to load student.");
    }
  }
);

export const createStudent = createAsyncThunk(
  "students/createStudent",
  async (payload: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post(API.STUDENTS, payload);
      return response?.data?.data as StudentRecord;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to create student.");
    }
  }
);

export const updateStudent = createAsyncThunk(
  "students/updateStudent",
  async ({ id, payload }: { id: string; payload: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${API.STUDENTS}/${id}`, payload);
      return response?.data?.data as StudentRecord;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to update student.");
    }
  }
);

export const deleteStudent = createAsyncThunk(
  "students/deleteStudent",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`${API.STUDENTS}/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? "Unable to delete student.");
    }
  }
);

const studentsSlice = createSlice({
  name: "students",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unable to load students.";
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to load student.";
      })
      .addCase(createStudent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) ?? "Unable to create student.";
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.items = state.items.map((student) =>
          student._id === action.payload._id ? action.payload : student
        );
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.items = state.items.filter((student) => student._id !== action.payload);
      });
  },
});

export default studentsSlice.reducer;


