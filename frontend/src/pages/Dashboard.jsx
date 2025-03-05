import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import NearbyProfessionals from '../components/network/NearbyProfessional';
import CreatePost from '../components/posts/CreatePost';
import Posts from '../components/posts/Posts';
import api from '../services/api';
import StoryCard from '../components/posts/StoryCard';

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [pendingRequests, setPendingRequests] = useState(0);
  const [events, setEvents] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);


  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Fetch pending connection requests count
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user) return;
      
      try {
        const response = await api.getConnectionRequests();
        setPendingRequests(response.length);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchPendingRequests();
  }, [user]);

  // Fetch stories

  // Fetch upcoming events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      try {
        // This would be an API call in a real implementation
        // For now we'll use mock data
        const mockEvents = [
          {
            _id: 'event1',
            title: 'Networking Mixer',
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            location: 'Virtual',
            attendees: 45
          },
          {
            _id: 'event2',
            title: 'Tech Conference 2023',
            date: new Date(Date.now() + 604800000).toISOString(), // 1 week later
            location: 'Convention Center',
            attendees: 320
          }
        ];
        
        setEvents(mockEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [user]);

  // Fetch job recommendations
  useEffect(() => {
    const fetchJobRecommendations = async () => {
      if (!user) return;
      
      try {
        // This would be an API call in a real implementation
        // For now we'll use mock data
        const mockJobs = [
          {
            _id: 'job1',
            title: 'Senior Developer',
            company: 'Tech Solutions Inc.',
            location: 'Remote',
            salary: '$120k - $150k',
            postedDate: new Date(Date.now() - 172800000).toISOString() // 2 days ago
          },
          {
            _id: 'job2',
            title: 'Product Manager',
            company: 'Innovative Startup',
            location: 'San Francisco, CA',
            salary: '$110k - $140k',
            postedDate: new Date(Date.now() - 259200000).toISOString() // 3 days ago
          }
        ];
        
        setJobRecommendations(mockJobs);
      } catch (error) {
        console.error('Error fetching job recommendations:', error);
      }
    };

    fetchJobRecommendations();
  }, [user]);

  // Format the date for events
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Handle new post creation
  const handlePostCreated = (newPost) => {
    // In a real app, you would update the posts state
    // For now, just show alert for demo purposes
    alert('Post created successfully!');
    setLoadingPosts(false);
  };

  // Handle view story

  // Format time since story creation
  const formatTimeSince = (timestamp) => {
    const now = new Date();
    const storyTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - storyTime) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    return '1d'; // Stories disappear after 24h anyway
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Custom navbar with orange theme */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-white font-bold text-2xl">ProfNet</div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                />
                <div className="absolute right-3 top-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-white hover:text-orange-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="text-white hover:text-orange-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-white overflow-hidden cursor-pointer">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.firstName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-orange-200 text-orange-700 font-bold">
                      {user?.firstName?.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stories Section - Orange Theme */}
      <StoryCard/>

        {/* New Content Layout - 3 Columns with NearbyProfessionals in Middle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card & Post Feed */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white shadow rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-24 relative">
                {/* Profile image */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className="h-20 w-20 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-md">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full flex items-center justify-center bg-orange-100 text-orange-600 text-2xl font-bold">
                        {user?.firstName?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-12 pb-5 px-4 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-500">{user?.headline || 'Professional Title'}</p>
                
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Profile views</span>
                    <span className="font-medium text-gray-900">142</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Connections</span>
                    <span className="font-medium text-gray-900">{user?.connectionCount || 0}</span>
                  </div>
                </div>
                
                <div className="mt-5">
                  <Link 
                    to="/profile" 
                    className="block w-full py-2 px-4 bg-orange-500 rounded-md text-center text-white hover:bg-orange-600 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Create Post Component */}
            <div className="bg-white shadow rounded-xl p-4">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full overflow-hidden">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold">
                        {user?.firstName?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/posts/create')}
                  className="flex-grow bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 text-gray-600 text-left"
                >
                  What's on your mind, {user?.firstName}?
                </button>
              </div>
              
              <div className="flex mt-3 pt-2 border-t border-gray-100">
                <button className="flex items-center justify-center text-orange-500 hover:text-orange-600 flex-1 py-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photo
                </button>
                <button className="flex items-center justify-center text-orange-500 hover:text-orange-600 flex-1 py-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video
                </button>
                <button className="flex items-center justify-center text-orange-500 hover:text-orange-600 flex-1 py-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Event
                </button>
              </div>
            </div>
            
            {/* Upcoming Events Card */}
            <div className="bg-white shadow rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-orange-600">Upcoming Events</h3>
                <Link to="/events" className="text-xs text-orange-500 hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {events.length > 0 ? (
                  events.map(event => (
                    <div key={event._id} className="px-4 py-3 hover:bg-orange-50">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{formatEventDate(event.date)}</span>
                        <span className="mx-1">•</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="mt-1 text-xs text-orange-500">
                        {event.attendees} attending
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    No upcoming events
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Middle Column - NearbyProfessionals */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white shadow rounded-xl overflow-hidden">
              <NearbyProfessionals />
            </div>
          </div>
          
          {/* Right Column - Post Feed & Recommendations */}
          <div className="lg:col-span-1 space-y-6">
            {/* Posts Feed */}
            <div className="bg-white shadow rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-orange-600">Recent Activity</h3>
              </div>
              <div className="p-4">
                {loadingPosts ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <Posts />
                )}
              </div>
            </div>
            
            {/* Job Recommendations */}
            <div className="bg-white shadow rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-orange-600">Jobs For You</h3>
                <Link to="/jobs" className="text-xs text-orange-500 hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {jobRecommendations.length > 0 ? (
                  jobRecommendations.map(job => (
                    <div key={job._id} className="px-4 py-3 hover:bg-orange-50">
                      <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                      <p className="mt-1 text-xs text-gray-600 font-medium">{job.company}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{job.location}</span>
                        <span className="mx-1">•</span>
                        <span>{job.salary}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    No job recommendations available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Orange-themed footer */}
      <footer className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2023 ProfNet • Privacy Policy • Terms of Service</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;