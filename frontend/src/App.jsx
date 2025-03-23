import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast'
// Pages
import AuthPage from './pages/AuthPage';
import Discover from './pages/DiscoverPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import NearbyProfessionals from './pages/NetworkPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import NetworkPage from './components/network/NearbyProfessional';
import CreateStoryPage from './pages/CreateStroyPage';
import StoryViewPage from './pages/StoryViewPage';
import CreatePost from './components/posts/CreatePost';
import ProfilePage from './pages/ProfilePage';
import PortfolioPage from './pages/PortfolioPage';
import AddAchievementForm from './components/profile/AddAchievementForm';
import AddProjectForm from './components/profile/AddProjectForm';
import ProfileViewersPage from './pages/ProfileViewerPage';
import RecommendedConnections from './pages/RecommendedConnections';
import EditProfilePage from './pages/EditProfilePage';
import NetworkExplorePage from './pages/NetworkExplorePage';
import ProjectCreationPage from './components/portfolio/ProjectCreation';
import ConnectionRequestPage from './pages/ConnectionRecommendation';
import AchievementCreationPage from './components/portfolio/AchievementCreation';
import StreakCreationPage from './components/portfolio/StreakCreation';
import LinkCall from './pages/LinkCall';
const App = () => {
  return (
    <Router>
      <AuthProvider>
          <ToastProvider>
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
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Profile Routes - Add both formats */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          {/* Network Routes */}
          <Route path="/network" element={<NetworkExplorePage />} />
          <Route path="/network/:section" element={<NetworkPage />} />
          <Route path="/network/suggested" element={<RecommendedConnections />} />
          <Route path="/network/nearby" element={<NearbyProfessionals />} />
          
          {/* Chat Routes */}
          <Route path="/chat">
            <Route index element={<ChatPage />} />
            <Route path=":chatId" element={<ChatPage />} />
          </Route>
          
          <Route path="/posts/create" element={<CreatePost/>}/>
          <Route path="/stories/create" element={<CreateStoryPage/>}/>
          <Route path="/stories/view" element={<StoryViewPage/>}/>
          <Route path="/portfolio" element={<PortfolioPage/>}/>
          <Route path="/portfolio/projects/new" element={<ProjectCreationPage/>}/>
          <Route path="/portfolio/achievements/new" element={<AchievementCreationPage/>}/>
          <Route path="/portfolio/streak/new" element={<StreakCreationPage/>}/>
          <Route path="/porfile/views" element={<ProfileViewersPage/>}/>
          <Route path="/connections" element={<ConnectionRequestPage/>}/>
          <Route path="/discover" element={<Discover/>}/>
          <Route path="/auth/linkedin-callback" element={<LinkCall/>}/>
          {/* Redirect root to dashboard or login based on authentication */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
          </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
// import React from 'react'

// const App = () => {
//   return (
//     <div>under maintenance
//       we will be back soon
//     </div>
//   )
// }

// export default App
