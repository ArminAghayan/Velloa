import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './propertySlice';

const store = configureStore({
  reducer: {
    property: propertyReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; // Define the AppDispatch type