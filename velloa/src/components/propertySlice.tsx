import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import { AppDispatch } from './store'; // Import the AppDispatch type

interface UnitData {
  key: string;
  unitNumber: number;
  floor: number;
  unitPrice: number;
  propertyId: string;
}

interface PropertyState {
  propertyId: string;
  units: UnitData[];
}

const initialState: PropertyState = {
  propertyId: '',
  units: [],
};

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setPropertyId: (state, action: PayloadAction<string>) => {
      state.propertyId = action.payload;
    },
    setUnits: (state, action: PayloadAction<UnitData[]>) => {
      state.units = action.payload;
    },
  },
});

export const { setPropertyId, setUnits } = propertySlice.actions;

export const fetchUnits = (propertyId: string) => async (dispatch: AppDispatch) => {
  if (propertyId) {
    const unitsRef = collection(db, 'units');
    const unitsQuery = query(unitsRef, where('propertyId', '==', propertyId));
    const snapshot = await getDocs(unitsQuery);
    const unitDataList: UnitData[] = snapshot.docs.map((doc) => ({
      key: doc.id,
      unitNumber: doc.data().unitNumber ?? 0,
      floor: doc.data().floor ?? 0,
      unitPrice: doc.data().unitPrice ?? 0,
      propertyId: doc.data().propertyId ?? '',
    }));
    dispatch(setUnits(unitDataList));
  }
};

export default propertySlice.reducer;