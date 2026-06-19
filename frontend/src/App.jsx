import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import ErrorBoundary from './components/common/ErrorBoundary';

import Landing from './pages/Home/Home';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import AdminLogin from './pages/Login/AdminLogin';
import AccessDenied from './pages/Login/AccessDenied';
import DashboardLayout from './components/layout/DashboardLayout';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import ProfessorDashboard from './pages/Dashboard/ProfessorDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import ClubLeaderDashboard from './pages/Dashboard/ClubLeaderDashboard';
import EventsListing from './pages/Events/EventsListing';
import EventDetail from './pages/EventDetails/EventDetail';
import ClubsListing from './pages/Clubs/ClubsListing';
import ClubDetail from './pages/ClubDetails/ClubDetail';
import Chat from './pages/Chat/Chat';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import ResourceDetail from './pages/Resources/ResourceDetail';
import MembersManagement from './pages/MembersManagement/MembersManagement';


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-spinner-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="shimmer-bone" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-spinner-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="shimmer-bone" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/admin-login" />;
  if (user?.role !== 'admin') return <AccessDenied />;
  return children;
}

function UnauthenticatedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-spinner-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="shimmer-bone" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />;
  }
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'professor') return <ProfessorDashboard />;
  if (user?.role === 'clubLeader') return <ClubLeaderDashboard />;
  return <StudentDashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UnauthenticatedRoute><Landing /></UnauthenticatedRoute>} />
      <Route path="/login" element={<UnauthenticatedRoute><Login /></UnauthenticatedRoute>} />
      <Route path="/signup" element={<UnauthenticatedRoute><Signup /></UnauthenticatedRoute>} />
      <Route path="/admin-login" element={<UnauthenticatedRoute><AdminLogin /></UnauthenticatedRoute>} />
      <Route path="/403" element={<AccessDenied />} />

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ErrorBoundary><DashboardRouter /></ErrorBoundary>} />
        <Route path="/admin" element={<AdminProtectedRoute><ErrorBoundary><AdminDashboard /></ErrorBoundary></AdminProtectedRoute>} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><ErrorBoundary><AdminDashboard /></ErrorBoundary></AdminProtectedRoute>} />
        <Route path="/events" element={<ErrorBoundary><EventsListing /></ErrorBoundary>} />
        <Route path="/events/:id" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />
        <Route path="/clubs" element={<ErrorBoundary><ClubsListing /></ErrorBoundary>} />
        <Route path="/clubs/manage" element={<ErrorBoundary><ProfessorDashboard initialTab="clubs" /></ErrorBoundary>} />
        <Route path="/clubs/:id" element={<ErrorBoundary><ClubDetail /></ErrorBoundary>} />
        <Route path="/chat" element={<ErrorBoundary><Chat /></ErrorBoundary>} />
        <Route path="/chat/:conversationId" element={<ErrorBoundary><Chat /></ErrorBoundary>} />
        <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
        <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        <Route path="/resources/:id" element={<ErrorBoundary><ResourceDetail /></ErrorBoundary>} />
        <Route path="/members-management" element={<ErrorBoundary><MembersManagement /></ErrorBoundary>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
