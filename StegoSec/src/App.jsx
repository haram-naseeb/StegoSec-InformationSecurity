import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './pages/Layout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import StealthMode from './components/StealthMode';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuditProvider } from './contexts/AuditContext';
import { FriendProvider } from './contexts/FriendContext';

import './index.css';

// We will create these shortly
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AttackSimulatorPage from './pages/AttackSimulatorPage';
import SteganalysisPage from './pages/SteganalysisPage';
import AuditLogPage from './pages/AuditLogPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen"><span className="text-primary">LOADING SYSTEM...</span></div>;
  if (!user) return <Navigate to="/auth" />;
  if (adminOnly && user.id !== 'admin') return <Navigate to="/chat" />;
  return children;
};

function App() {
  return (
    <AuditProvider>
      <AuthProvider>
        <FriendProvider>
          <StealthMode>
            <Router>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/simulator" element={<AttackSimulatorPage />} />
                  <Route path="/steganalysis" element={<SteganalysisPage />} />
                  <Route path="/audit" element={<ProtectedRoute adminOnly={true}><AuditLogPage /></ProtectedRoute>} />
                </Route>
              </Routes>
            </Router>
          </StealthMode>
        </FriendProvider>
      </AuthProvider>
    </AuditProvider>
  );
}

export default App;
