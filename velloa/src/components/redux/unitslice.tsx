import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Unit {
  unitName: string;
  tenant?: string;
  beds: number;
  baths: number;
  marketRent: number;
  size: number;
  description?: string;
  images?: string[];
}

interface UnitState {
  selectedUnit: Unit | null;
}

const initialState: UnitState = {
  selectedUnit: null,
};

const unitSlice = createSlice({
  name: 'unit',
  initialState,
  reducers: {
    setSelectedUnit: (state, action: PayloadAction<Unit>) => {
      state.selectedUnit = action.payload;
    },
    clearSelectedUnit: (state) => {
      state.selectedUnit = null;
    },
  },
});

export const { setSelectedUnit, clearSelectedUnit } = unitSlice.actions;
export default unitSlice.reducer;
