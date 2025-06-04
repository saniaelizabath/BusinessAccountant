import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Start from './pages/Start';
import Products from './pages/Products';
import CustomerOrders from './pages/CustomerOrders'; // ✅ Add this
import PrivateRoute from './components/PrivateRoute';
import Stock from './pages/Stock';
import RawMaterials from './pages/RawMaterials';
import EmployeeManagement from './pages/EmployeeManagement';
import MonthlyRevenue from './pages/MonthlyRevenue';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="/orders" 
          element={
            <PrivateRoute>
              <CustomerOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/stock" 
          element={
            <PrivateRoute>
              <Stock />
            </PrivateRoute>
          }
        />
        <Route
          path="/rawmaterials" 
          element={
            <PrivateRoute>
              <RawMaterials />
            </PrivateRoute>
          }
        />

        <Route
          path="/employeemanagement" 
          element={
            <PrivateRoute>
              <EmployeeManagement />
            </PrivateRoute>
          }
        />

        <Route
          path="/monthlyrevenue" 
          element={
            <PrivateRoute>
              <MonthlyRevenue />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
