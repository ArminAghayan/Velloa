import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../components/redux/authSlice';

const ProtectedRoute = () => {
  const isAuth = useSelector(isAuthenticated);

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;