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
import PostsFetcher from './pages/PostFetcher';
import LinkCall from './pages/LinkCall';

// Event Management Pages
import EventListingPage from './pages/EventsListingPage';
import EventDetailPage from './pages/EventDetailPage';
import EventCreationPage from './pages/EventCreationPage';
import TicketPurchasePage from './pages/TicketPurchasePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TicketBookingPage from './pages/TicketBookingPage';
import TicketConfirmationPage from './pages/TicketConfirmationPage';
import MyEventsPage from './pages/MyEventsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import EventDashboardPage from './pages/EventsDashboard';
import CreateTicketsPage from './pages/CreateTicketsPage';
import AttendeeManagementPage from './pages/AttendeeManagementPage'; 
import TicketManagementPage from './pages/TicketManagementPage';
import CheckInPage from './pages/CheckInPage';
import PrivacyPolicy from './pages/PrivacyPolicy';

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
          <Route path="/privacypolicy" element={<PrivacyPolicy />} />
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
          <Route path='/psf' element={<PostsFetcher/>}/>
          
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
          
          {/* Event Management Routes */}
          <Route path="/events" element={<EventListingPage/>}/>
          <Route path="/events/new" element={<EventCreationPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/events/create" element={<EventCreationPage />} />
          <Route path="/events/:eventId/edit" element={<EventCreationPage />} />
          <Route path="/events/:eventId/tickets" element={<TicketBookingPage />} />
          <Route path="/events/:eventId/manage" element={<EventDashboardPage />} />
          <Route path="/events/:eventId/attendees" element={<AttendeeManagementPage />} />
          <Route path="/events/:eventId/tickets/create" element={<CreateTicketsPage/>} />
          <Route path="/events/:eventId/checkin" element={<CheckInPage />} />
          
          {/* My Events & Tickets */}
          <Route path="/my-events" element={<MyEventsPage />} />
          <Route path="/tickets" element={<MyTicketsPage />} />
          <Route path="/tickets/book/:eventId" element={<TicketPurchasePage />} />
          <Route path="/tickets/confirmation/:bookingId" element={<TicketConfirmationPage />} />
          <Route path="/payment/success/:bookingId" element={<PaymentSuccessPage />} />
          
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
