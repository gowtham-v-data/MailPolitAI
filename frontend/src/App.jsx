import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/Toast';
import AssistantLayout from './layouts/AssistantLayout';
import ClientLayout from './layouts/ClientLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import EmailInbox from './pages/EmailInbox';
import EmailDetail from './pages/EmailDetail';
import AIAssistant from './pages/AIAssistant';
import Clients from './pages/Clients';
import Meetings from './pages/Meetings';
import Settings from './pages/Settings';
import ClientDashboard from './pages/ClientDashboard';
import AuthCallback from './pages/AuthCallback';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="email/:id" element={<EmailDetail clientView />} />
      </Route>
      <Route path="/" element={<ProtectedRoute><AssistantLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="emails" element={<EmailInbox />} />
        <Route path="emails/:classification" element={<EmailInbox />} />
        <Route path="email/:id" element={<EmailDetail />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="clients" element={<Clients />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
