import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import PublicPage from './pages/PublicPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminGuests from './pages/AdminGuests';
import AdminVendors from './pages/AdminVendors';
import AdminBudget from './pages/AdminBudget';
import AdminTimeline from './pages/AdminTimeline';
import RsvpPage from './pages/RsvpPage';
import AdminLayout from './components/AdminLayout';
import AdminSections from './pages/AdminSections';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:slug" element={<PublicPage />} />
        <Route path="/:slug/rsvp" element={<RsvpPage />} />
        <Route path="/:slug/admin/login" element={<AdminLogin />} />
        <Route path="/:slug/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="guests" element={<AdminGuests />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="budget" element={<AdminBudget />} />
          <Route path="timeline" element={<AdminTimeline />} />
          <Route path="sections" element={<AdminSections />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
