import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import { ToastContainer } from './components/ui/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Submit from './pages/Submit';
import Complaints from './pages/Complaints';
import Track from './pages/Track';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import AdminComplaints from './pages/admin/Complaints';
import AdminAnalytics from './pages/admin/Analytics';
import AdminDepartments from './pages/admin/Departments';
import AdminSettings from './pages/admin/Settings';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes for Authenticated Users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/track" element={<Track />} />
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Admin Routes with Role Protection */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/complaints" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
