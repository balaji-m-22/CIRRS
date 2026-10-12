import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Navbar from './components/Navbar';
import { Spinner } from './components/ui';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewReport from './pages/NewReport';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Notifications from './pages/Notifications';
import Users from './pages/admin/Users';
import Departments from './pages/admin/Departments';

// Redirects to /login when logged out, and to Home when the role is not allowed
function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/report/new" element={<Protected roles={['citizen']}><NewReport /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/reports/:id" element={<Protected><ReportDetail /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/admin/users" element={<Protected roles={['admin']}><Users /></Protected>} />
          <Route path="/admin/departments" element={<Protected roles={['admin']}><Departments /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
