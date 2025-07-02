

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './MainPage';
import AdminPage from './AdminPage';
import AdminLogin from './AdminLogin';
import AdminRegister from './AdminRegister';
import ProtectedRoute from './ProtectedRoute';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/admin" element={<Navigate to="/admin-login" replace />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route 
          path="/admin-panel" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;