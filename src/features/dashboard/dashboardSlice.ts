import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { API } from "../../api/endpoints";

export interface AdminDashboardStats {
  totalStudents: number;
  totalReceptionists: number;
  totalCollection: number;
  todayCollection: number;
  monthCollection: number;
  pendingFee: number;
  paidStudents: number;
  dueStudents: number;
}

export interface RecentTransaction {
  _id: string;
  receiptNo: string;
  student: {
    _id: string;
    studentId: string;
    name: string;
    mobile: string;
    className: string;
    section: string;
  };
  studentId: string;
  amount: number;
  paymentMode: string;
  paymentStatus: string;
  transactionId: string;
  remarks: string;
  collectedBy: {
    _id: string;
    name: string;
    role: string;
  };
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface TopDueStudent {
  _id: string;
  studentId: string;
  name: string;
  mobile: string;
  className: string;
  totalFee: number;
  paidFee: number;
  dueFee: number;
}

export interface PaymentModeSummary {
  _id: string;
  totalAmount: number;
  totalTransactions: number;
}

export interface ClassWiseCollection {
  _id: string;
  totalCollection: number;
  totalTransactions: number;
}

interface DashboardState {
  adminStats: AdminDashboardStats | null;
  recentTransactions: RecentTransaction[];
  monthlyCollectionSeries: { month: string; amount: number }[];
  topDueStudents: TopDueStudent[];
  paymentModeSummary: PaymentModeSummary[];
  classWiseCollection: ClassWiseCollection[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  adminStats: null,
  recentTransactions: [],
  monthlyCollectionSeries: [],
  topDueStudents: [],
  paymentModeSummary: [],
  classWiseCollection: [],
  loading: false,
  error: null,
};

export const fetchAdminDashboard = createAsyncThunk(
  "dashboard/fetchAdminDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API.DASHBOARD_ADMIN);
      const stats = response?.data?.data ?? response?.data;

      if (!stats) {
        return rejectWithValue("Invalid dashboard response.");
      }

      return stats as AdminDashboardStats;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to load dashboard."
      );
    }
  }
);

export const fetchRecentTransactions = createAsyncThunk(
  "dashboard/fetchRecentTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API.DASHBOARD_RECENT_TRANSACTIONS);
      const transactions = response?.data?.data ?? response?.data;

      if (!Array.isArray(transactions)) {
        return rejectWithValue("Invalid recent transactions response.");
      }

      return transactions as RecentTransaction[];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to load recent transactions."
      );
    }
  }
);

export const fetchMonthlyCollection = createAsyncThunk(
  "dashboard/fetchMonthlyCollection",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API.DASHBOARD_MONTHLY_COLLECTION);
      const entries = response?.data?.data ?? response?.data;

      if (!Array.isArray(entries)) {
        return rejectWithValue("Invalid monthly collection response.");
      }

      return entries.map((entry: { _id: { year: number; month: number }; total: number }) => ({
        month: `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`,
        amount: entry.total,
      }));
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to load monthly collection."
      );
    }
  }
);

export const fetchTopDueStudents = createAsyncThunk(
  "dashboard/fetchTopDueStudents",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/dashboard/top-due-students");
      const students = response?.data?.data ?? response?.data;
      if (!Array.isArray(students)) {
        return rejectWithValue("Invalid top due students response.");
      }
      return students as TopDueStudent[];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to load top due students."
      );
    }
  }
);

export const fetchPaymentModeSummary = createAsyncThunk(
  "dashboard/fetchPaymentModeSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/dashboard/payment-mode");
      const modes = response?.data?.data ?? response?.data;
      if (!Array.isArray(modes)) {
        return rejectWithValue("Invalid payment mode response.");
      }
      return modes as PaymentModeSummary[];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to load payment mode summary."
      );
    }
  }
);

export const fetchClassWiseCollection = createAsyncThunk(
  "dashboard/fetchClassWiseCollection",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/dashboard/class-wise-collection");
      const classes = response?.data?.data ?? response?.data;
      if (!Array.isArray(classes)) {
        return rejectWithValue("Invalid class wise collection response.");
      }
      return classes as ClassWiseCollection[];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to load class wise collection."
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearAdminDashboard(state) {
      state.adminStats = null;
      state.recentTransactions = [];
      state.monthlyCollectionSeries = [];
      state.topDueStudents = [];
      state.paymentModeSummary = [];
      state.classWiseCollection = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.adminStats = action.payload;
      })
      .addCase(fetchRecentTransactions.fulfilled, (state, action) => {
        state.recentTransactions = action.payload;
      })
      .addCase(fetchMonthlyCollection.fulfilled, (state, action) => {
        state.monthlyCollectionSeries = action.payload;
      })
      .addCase(fetchTopDueStudents.fulfilled, (state, action) => {
        state.topDueStudents = action.payload;
      })
      .addCase(fetchPaymentModeSummary.fulfilled, (state, action) => {
        state.paymentModeSummary = action.payload;
      })
      .addCase(fetchClassWiseCollection.fulfilled, (state, action) => {
        state.classWiseCollection = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unable to load dashboard.";
      });
  },
});

export const { clearAdminDashboard } = dashboardSlice.actions;

export default dashboardSlice.reducer;
