
import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const userRole = sessionStorage.getItem('userRole');

  if (!userRole) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default ProtectedRoute;