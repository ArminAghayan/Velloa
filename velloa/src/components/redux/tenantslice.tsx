import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Tenant {
  tenantId: string;
  tenantName: string;
  firstName: string;
  unit: string;
  paymentDate: string;
  rentAmount: number;
  description?: string;
}

interface TenantState {
  selectedTenant: Tenant | null;
}

const initialState: TenantState = {
  selectedTenant: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setSelectedTenant(state, action: PayloadAction<Tenant>) {
      state.selectedTenant = action.payload;
    },
    clearSelectedTenant(state) {
      state.selectedTenant = null;
    },
  },
});

export const { setSelectedTenant, clearSelectedTenant } = tenantSlice.actions;

export default tenantSlice.reducer;
