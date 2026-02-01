import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import GroupsPage from './pages/GroupsPage';
import UserPortalPage from './pages/UserPortalPage';
import EvaluationPeriodsPage from './pages/EvaluationPeriodsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import GroupScoresPage from './pages/GroupScoresPage';
import KpiManagementPage from './pages/KpiManagementPage';
import KpiCreatePage from './pages/KpiCreatePage';
import KpiFillPage from './pages/KpiFillPage';

// Protected route для админов
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};

// Protected route для обычных пользователей
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'user') {
    return <Navigate to="/users" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  // Определение редиректа после авторизации
  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    return role === 'admin' ? '/users' : '/portal';
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={role === 'admin' ? '/users' : '/portal'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin routes */}
      <Route
        path="/users"
        element={
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <AdminRoute>
            <GroupsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/evaluation-periods"
        element={
          <AdminRoute>
            <EvaluationPeriodsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/group-scores"
        element={
          <AdminRoute>
            <GroupScoresPage />
          </AdminRoute>
        }
      />
      <Route
        path="/kpis/new"
        element={
          <AdminRoute>
            <KpiCreatePage />
          </AdminRoute>
        }
      />
      <Route
        path="/kpis"
        element={
          <AdminRoute>
            <KpiManagementPage />
          </AdminRoute>
        }
      />

      {/* User portal route */}
      <Route
        path="/portal"
        element={
          <UserRoute>
            <UserPortalPage />
          </UserRoute>
        }
      />
      <Route
        path="/evaluations"
        element={
          <UserRoute>
            <EvaluationsPage />
          </UserRoute>
        }
      />
      <Route
        path="/my-kpis/:id"
        element={
          <UserRoute>
            <KpiFillPage />
          </UserRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default App;
