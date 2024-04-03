import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FormState {
  selectedFormId: string | null;
}

const initialState: FormState = {
  selectedFormId: null,
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    setSelectedFormId: (state, action: PayloadAction<string>) => {
      state.selectedFormId = action.payload;
    },
  },
});

export const { setSelectedFormId } = formSlice.actions;
export default formSlice.reducer;