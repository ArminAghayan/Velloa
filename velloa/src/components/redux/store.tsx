import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './propertySlice';
import authReducer from './authSlice';

export interface Property {
  id: string;
  propertyName: string;
  imageUrl?: string;
  numUnits: number;
}

const store = configureStore({
  reducer: {
    property: propertyReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;