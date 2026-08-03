import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

export interface FeeStructureRecord {
  _id: string;
  className: string;
  admissionFee: number;
  monthlyFee: number;
  examFee: number;
  sportFee: number;
  computerFee: number;
  functionFee: number;
  smartClassFee: number;
  otherCharges: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  totalFee: number;
}

interface FeeStructuresState {
  items: FeeStructureRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: FeeStructuresState = { items: [], loading: false, error: null };

export const fetchFeeStructures = createAsyncThunk('feeStructures/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(API.FEE_STRUCTURES);
    return (response?.data?.data ?? response?.data ?? []) as FeeStructureRecord[];
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? 'Unable to load fee structures.');
  }
});

export const fetchFeeStructureById = createAsyncThunk('feeStructures/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    const response = await api.get(`${API.FEE_STRUCTURES}/${id}`);
    return response?.data?.data as FeeStructureRecord;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? 'Unable to load fee structure.');
  }
});

export const fetchFeeStructureByClass = createAsyncThunk('feeStructures/fetchByClass', async (className: string, { rejectWithValue }) => {
  try {
    const response = await api.get(`${API.FEE_STRUCTURES}/class/${className}`);
    return response?.data?.data as FeeStructureRecord;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? 'Unable to load fee structure.');
  }
});

export const createFeeStructure = createAsyncThunk(
  'feeStructures/create',
  async (payload: Omit<FeeStructureRecord, '_id' | 'isActive' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt' | 'totalFee'>, { rejectWithValue }) => {
    try {
      const response = await api.post(API.FEE_STRUCTURES, payload);
      return response?.data?.data as FeeStructureRecord;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? 'Unable to create fee structure.');
    }
  }
);

export const updateFeeStructure = createAsyncThunk(
  'feeStructures/update',
  async ({ id, payload }: { id: string; payload: Partial<FeeStructureRecord> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${API.FEE_STRUCTURES}/${id}`, payload);
      return response?.data?.data as FeeStructureRecord;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message ?? 'Unable to update fee structure.');
    }
  }
);

export const deleteFeeStructure = createAsyncThunk('feeStructures/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`${API.FEE_STRUCTURES}/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? 'Unable to delete fee structure.');
  }
});

const feeStructuresSlice = createSlice({
  name: 'feeStructures',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeeStructures.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFeeStructures.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchFeeStructures.rejected, (state, action) => { state.loading = false; state.error = (action.payload as string) ?? 'Unable to load fee structures.'; })
      .addCase(createFeeStructure.fulfilled, (state, action) => { state.items = [action.payload, ...state.items]; })
      .addCase(updateFeeStructure.fulfilled, (state, action) => { state.items = state.items.map((item) => item._id === action.payload._id ? action.payload : item); })
      .addCase(deleteFeeStructure.fulfilled, (state, action) => { state.items = state.items.filter((item) => item._id !== action.payload); });
  },
});

export default feeStructuresSlice.reducer;
