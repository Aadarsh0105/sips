import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { API } from "../../api/endpoints";

export interface ReceptionistRecord {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ReceptionistsState {
  items: ReceptionistRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: ReceptionistsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchReceptionists = createAsyncThunk(
  "receptionists/fetchReceptionists",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API.RECEPTIONISTS);
      return (response?.data?.data ?? response?.data ?? []) as ReceptionistRecord[];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to load receptionists."
      );
    }
  }
);

export const createReceptionist = createAsyncThunk(
  "receptionists/createReceptionist",
  async (
    payload: { name: string; email: string; mobile: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(API.RECEPTIONISTS, payload);
      return response?.data?.data as ReceptionistRecord;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to create receptionist."
      );
    }
  }
);

export const updateReceptionist = createAsyncThunk(
  "receptionists/updateReceptionist",
  async (
    { id, payload }: { id: string; payload: { name: string; email: string; mobile: string; password?: string } },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`${API.RECEPTIONISTS}/${id}`, payload);
      return response?.data?.data as ReceptionistRecord;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to update receptionist."
      );
    }
  }
);

export const deleteReceptionist = createAsyncThunk(
  "receptionists/deleteReceptionist",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`${API.RECEPTIONISTS}/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Unable to delete receptionist."
      );
    }
  }
);

const receptionistsSlice = createSlice({
  name: "receptionists",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReceptionists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceptionists.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReceptionists.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unable to load receptionists.";
      })
      .addCase(createReceptionist.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(updateReceptionist.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item._id === action.payload._id ? action.payload : item));
      })
      .addCase(deleteReceptionist.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      });
  },
});

export default receptionistsSlice.reducer;
