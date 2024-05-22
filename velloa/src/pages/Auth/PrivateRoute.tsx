import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAuthenticated } from '../../components/redux/authSlice';
import { RootState } from '../../components/redux/store';

const ProtectedRoute: React.FC = () => {
  const authenticated = useSelector(isAuthenticated);
  const loading = useSelector((state: RootState) => state.auth.isLoading);

  if (loading) {
    return <div>Loading...</div>; // You can customize this loading state
  }

  return authenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
