import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './propertySlice';
import authReducer from './authSlice';
import formReducer from './formSlice';
import unitReducer from './unitslice';
import tenantReducer from './tenantslice'; // Import the tenant slice

const store = configureStore({
  reducer: {
    property: propertyReducer,
    auth: authReducer,
    form: formReducer,
    unit: unitReducer,
    tenant: tenantReducer, // Add the tenant slice to the store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
