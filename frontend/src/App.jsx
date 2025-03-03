import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import AuthPage from './pages/AuthPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import NetworkPage from './pages/NetworkPage';
// import ProfilePage from './page/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage type="signup" />} />
          <Route path="/phone-login" element={<AuthPage type="phone-login" />} />
          <Route path="/auth/callback" element={<AuthPage />} />
          
          {/* Profile Setup */}
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          
          {/* Main App Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/profile" element={<ProfilePage />} /> */}
          {/* <Route path="/profile/:userId" element={<ProfilePage />} /> */}
          
          {/* Network Routes */}
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/network/:section" element={<NetworkPage />} />
          
          {/* Chat Routes */}
       {/* Chat Routes */}
<Route path="/chat">
  <Route index element={<ChatPage />} />
  <Route path=":chatId" element={<ChatPage />} />
</Route>
          
          {/* Redirect root to dashboard or login based on authentication */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;