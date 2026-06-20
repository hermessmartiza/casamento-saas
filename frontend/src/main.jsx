import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import PublicPage from './pages/PublicPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminGuests from './pages/AdminGuests';
import AdminVendors from './pages/AdminVendors';
import AdminBudget from './pages/AdminBudget';
import AdminTimeline from './pages/AdminTimeline';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:slug" element={<PublicPage />} />
        <Route path="/:slug/admin/login" element={<AdminLogin />} />
        <Route path="/:slug/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="guests" element={<AdminGuests />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="budget" element={<AdminBudget />} />
          <Route path="timeline" element={<AdminTimeline />} />
        </Route>
        <Route path="/" element={<Navigate to="/demo" />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
