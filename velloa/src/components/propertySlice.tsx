import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import { AppDispatch } from './store';

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
  selectedUnit: UnitData | null;
}

const initialState: PropertyState = {
  propertyId: '',
  units: [],
  selectedUnit: null,
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
    setSelectedUnit: (state, action: PayloadAction<UnitData | null>) => {
      console.log('setSelectedUnit action received:', action.payload);
      state.selectedUnit = action.payload;
    },
  },
});

export const { setPropertyId, setUnits, setSelectedUnit } = propertySlice.actions;

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