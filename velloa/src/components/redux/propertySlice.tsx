// src/components/redux/propertySlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface Property {
  key: string;
  propertyName: string;
  imageUrl: string;
  propertyType: string;
  numberOfUnits: number;
  status: string;
  photos: string[];
}

interface PropertyState {
  property: Property | null;
  loading: boolean;
  error: string | null;
}

const initialState: PropertyState = {
  property: null,
  loading: false,
  error: null,
};

export const fetchPropertyDetails = createAsyncThunk(
  'property/fetchDetails',
  async (propertyId: string) => {
    const propertyRef = doc(db, 'properties', propertyId);
    const propertyDoc = await getDoc(propertyRef);
    if (propertyDoc.exists()) {
      return propertyDoc.data() as Property;
    } else {
      throw new Error('Property not found');
    }
  }
);

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setProperty: (state, action) => {
      state.property = action.payload;
    },
    setImageUrl: (state, action) => {
      if (state.property) {
        state.property.imageUrl = action.payload;
      }
    },
    setPhotos: (state, action) => {
      if (state.property) {
        state.property.photos = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPropertyDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.property = action.payload;
      })
      .addCase(fetchPropertyDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch property details';
      });
  },
});

export const { setProperty, setImageUrl, setPhotos } = propertySlice.actions;

export default propertySlice.reducer;
