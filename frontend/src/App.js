import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import VisitorForm from './components/Security/VisitorForm';
import Dashboard from './components/Admin/Dashboard';
import SuperAdminDashboard from './components/Admin/SuperAdminDashboard';
import Register from './components/Auth/Register';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/security" 
            element={
              isAuthenticated() && getUserRole() === 'security' ? 
              <VisitorForm /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin" 
            element={
              isAuthenticated() && getUserRole() === 'admin' ? 
              <Dashboard /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/super-admin" 
            element={
              isAuthenticated() && getUserRole() === 'super_admin' ? 
              <SuperAdminDashboard /> : <Navigate to="/login" />
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;