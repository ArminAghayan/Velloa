import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { auth, db } from '../../firebase-config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { RootState } from './store';

interface UserData {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  companyuid: string | null;
}

export const fetchUserDetails = createAsyncThunk(
  'auth/fetchUserDetails',
  async (uid: string) => {
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
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await dispatch(fetchUserDetails(user.uid)).unwrap();
      return {
        uid: user.uid,
        email: user.email,
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await signOut(auth);
});

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userData: UserData | null;
  error: string | null;
}

const initialState: AuthState = {
  isLoading: false,
  isAuthenticated: false,
  userData: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isAuthenticated = false;
        state.userData = null;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ uid: string; email: string | null }>) => {
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
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.userData = null;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.userData = null;
        state.error = null;
      })
      .addCase(fetchUserDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action: PayloadAction<UserData>) => {
        state.isLoading = false;
        state.userData = action.payload;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const isAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export default authSlice.reducer;
