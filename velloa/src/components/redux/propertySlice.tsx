import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Property } from './store';

interface PropertySliceState {
  selectedProperty: Property | null;
}

const initialState: PropertySliceState = {
  selectedProperty: null,
};

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setSelectedProperty: (state, action: PayloadAction<Property>) => {
      state.selectedProperty = action.payload;
    },
    clearSelectedProperty: (state) => {
      state.selectedProperty = null;
    },
  },
});

export const { setSelectedProperty, clearSelectedProperty } = propertySlice.actions;
export default propertySlice.reducer;