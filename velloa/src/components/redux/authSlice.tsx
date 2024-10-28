import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { auth, db } from '../../firebase-config';
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { RootState } from './store';

interface UserData {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  companyuid: string | null;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean | null; // Changed to null to represent unknown state initially
  userData: UserData | null;
  error: string | null;
}

const initialState: AuthState = {
  isLoading: true, // Initially loading
  isAuthenticated: null,
  userData: null,
  error: null,
};

// Async Thunks

export const fetchUserDetails = createAsyncThunk<
  UserData,
  string,
  { rejectValue: string }
>('auth/fetchUserDetails', async (uid: string, { rejectWithValue }) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      throw new Error('User document not found');
    }

    const userData = userSnapshot.data();
    return {
      uid: uid,
      email: auth.currentUser?.email || null,
      firstName: userData?.firstName ?? '',
      lastName: userData?.lastName ?? '',
      companyuid: userData?.companyuid ?? null,
    };
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const login = createAsyncThunk<
  { uid: string; email: string | null },
  { email: string; password: string; rememberMe: boolean },
  { rejectValue: string }
>('auth/login', async ({ email, password, rememberMe }, { dispatch, rejectWithValue }) => {
  try {
    if (rememberMe) {
      await setPersistence(auth, browserLocalPersistence);
    } else {
      await setPersistence(auth, browserSessionPersistence);
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return { uid: user.uid, email: user.email };
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await signOut(auth);
});

// Slice

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean | null>) => {
      state.isAuthenticated = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<{ uid: string; email: string | null }>) => {
          state.isLoading = false;
          state.isAuthenticated = true;
          if (state.userData) {
            state.userData.uid = action.payload.uid;
            state.userData.email = action.payload.email;
          } else {
            state.userData = {
              uid: action.payload.uid,
              email: action.payload.email,
              firstName: '',
              lastName: '',
              companyuid: null,
            };
          }
          state.error = null;
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.userData = null;
        state.error = action.payload as string;
      })

      // Logout Case
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.userData = null;
        state.error = null;
      })

      // Fetch User Details Cases
      .addCase(fetchUserDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action: PayloadAction<UserData>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.userData = action.payload;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const isAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const { setAuthenticated } = authSlice.actions;
export default authSlice.reducer;
