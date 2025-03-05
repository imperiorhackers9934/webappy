import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import NearbyProfessionals from '../components/network/NearbyProfessional';
import Posts from '../components/posts/Posts';
import api from '../services/api';
import StoryCard from '../components/posts/StoryCard';
import CreatePost from '../components/posts/CreatePost';

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [pendingRequests, setPendingRequests] = useState(0);
  const [events, setEvents] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 142,
    connections: 0,
    messagesSent: 28,
    postsCreated: 7
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Fetch data (using the same fetching logic as before)
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
    
    // Update connections count in stats
    setDashboardStats(prev => ({
      ...prev,
      connections: user?.connectionCount || 0
    }));
  }, [user]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
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

  useEffect(() => {
    const fetchJobRecommendations = async () => {
      if (!user) return;
      try {
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

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const handlePostCreated = () => {
    alert('Post created successfully!');
    setLoadingPosts(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={logout} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="md:pl-0 pl-0 md:pt-0 pt-16"> {/* Adjusted for sidebar */}
          <main className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Dashboard Header - Calendar View Style */}
            <div className="bg-white rounded-xl shadow-md mb-6 p-4 md:p-6 border-l-4 border-orange-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg bg-gradient-to-r from-orange-500 to-orange-400 mr-4 flex items-center justify-center text-white font-bold text-xl">
                      {new Date().getDate()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">Hello, {user?.firstName}!</h1>
                      <p className="text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 w-full md:w-auto">
                  <div className="flex items-center space-x-2">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-md text-sm font-medium">
                      {pendingRequests} connection requests
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
                      {events.length} upcoming events
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs Navigation */}
            <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden border-b">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`flex-1 text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'overview'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection('network')}
                  className={`flex-1 text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'network'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Network
                </button>
                <button
                  onClick={() => setActiveSection('content')}
                  className={`flex-1 text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'content'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setActiveSection('opportunities')}
                  className={`flex-1 text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'opportunities'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Opportunities
                </button>
              </div>
            </div>

            {/* Dashboard Content - Based on active section */}
            {activeSection === 'overview' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Profile Views</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{dashboardStats.profileViews}</h3>
                      </div>
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-sm mt-2">↑ 12% from last week</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Connections</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{dashboardStats.connections}</h3>
                      </div>
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-sm mt-2">↑ 3 new this week</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Messages</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{dashboardStats.messagesSent}</h3>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-sm mt-2">↑ 8 conversations active</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Posts</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{dashboardStats.postsCreated}</h3>
                      </div>
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-sm mt-2">↑ 4 engagement this week</p>
                  </div>
                </div>

                {/* Two Column Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Side - 3 columns */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                      </div>
                      <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <button 
                          onClick={() => navigate('/posts/create')}
                          className="flex flex-col items-center justify-center bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-sm font-medium">Create Post</span>
                        </button>
                        
                        <button 
                          onClick={() => navigate('/network')}
                          className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          <span className="text-sm font-medium">Connect</span>
                        </button>
                        
                        <button 
                          onClick={() => navigate('/messages')}
                          className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm font-medium">Message</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Stories */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Stories</h3>
                        <Link to="/stories" className="text-orange-500 hover:text-orange-600 text-sm">View All</Link>
                      </div>
                      <div className="p-6">
                        <StoryCard />
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                        <button className="text-gray-500 hover:text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-6">
                        {loadingPosts ? (
                          <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                          </div>
                        ) : (
                          <Posts />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side - 2 columns */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* User Profile Card */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="relative">
                        <div className="h-24 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                        <div className="absolute top-14 left-6">
                          <div className="h-20 w-20 rounded-lg border-4 border-white bg-white flex items-center justify-center shadow-md">
                            {user?.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt="Profile"
                                className="h-full w-full rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-lg flex items-center justify-center bg-orange-100 text-orange-600 text-2xl font-bold">
                                {user?.firstName?.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-14 pb-5 px-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {user?.firstName} {user?.lastName}
                            </h2>
                            <p className="text-sm text-gray-500">{user?.headline || 'Professional Title'}</p>
                          </div>
                          <Link 
                            to="/profile" 
                            className="text-orange-500 hover:text-orange-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>
                        </div>
                        
                        <div className="mt-6 bg-orange-50 rounded-lg p-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">Profile Completion: 68%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                              <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Link 
                              to="/profile/edit" 
                              className="text-orange-600 text-sm font-medium hover:text-orange-700"
                            >
                              Complete your profile →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Upcoming Events Card */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Upcoming Events</h3>
                        <Link to="/events" className="text-orange-500 hover:text-orange-600 text-sm">View All</Link>
                      </div>
                      <div className="p-6 space-y-4">
                        {events.length > 0 ? (
                          events.map(event => (
                            <div key={event._id} className="flex">
                              <div className="mr-4 flex-shrink-0">
                                <div className="h-14 w-14 rounded-lg bg-orange-100 flex flex-col items-center justify-center">
                                  <span className="text-orange-600 text-xs font-semibold">
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                  </span>
                                  <span className="text-orange-600 text-lg font-bold">
                                    {new Date(event.date).getDate()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                  <span>{formatEventDate(event.date)}</span>
                                  <span className="mx-1">•</span>
                                  <span>{event.location}</span>
                                </div>
                                <div className="mt-2">
                                  <span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                                    {event.attendees} attending
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500">No upcoming events</p>
                            <button className="mt-2 text-orange-500 hover:text-orange-600 text-sm font-medium">
                              Create an Event
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Job Recommendations */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Recommended Jobs</h3>
                        <Link to="/jobs" className="text-orange-500 hover:text-orange-600 text-sm">View All</Link>
                      </div>
                      <div className="p-6 space-y-4">
                        {jobRecommendations.length > 0 ? (
                          jobRecommendations.map(job => (
                            <div key={job._id} className="p-4 hover:bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex justify-between">
                                <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                                <button className="text-gray-400 hover:text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                  </svg>
                                </button>
                              </div>
                              <p className="mt-1 text-xs font-medium text-gray-700">{job.company}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                  {job.location}
                                </span>
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  {job.salary}
                                </span>
                              </div>
                              <div className="mt-3 flex justify-between items-center">
                                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                                  Apply Now
                                </button>
                                <span className="text-xs text-gray-500">
                                  Posted {new Date(job.postedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500">No job recommendations</p>
                            <button className="mt-2 text-orange-500 hover:text-orange-600 text-sm font-medium">
                              Update your skills
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'network' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Your Network</h2>
                  <p className="text-gray-500">Connect with professionals in your field</p>
                </div>
                
                {/* Connection requests and nearby professionals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-orange-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Requests</h3>
                    {pendingRequests > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl mr-3">
                              J
                            </div>
                            <div>
                              <h4 className="font-medium">John Smith</h4>
                              <p className="text-sm text-gray-500">Software Engineer at TechCorp</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm">Accept</button>
                            <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm">Ignore</button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mr-3">
                              S
                            </div>
                            <div>
                              <h4 className="font-medium">Sarah Johnson</h4>
                              <p className="text-sm text-gray-500">Product Manager at StartupXYZ</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm">Accept</button>
                            <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm">Ignore</button>
                          </div>
                        </div>
                        
                        <Link to="/network" className="block w-full text-center text-orange-500 font-medium mt-4">
                          View All Requests →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-sm text-gray-500">No pending requests</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Professionals</h3>
                    <NearbyProfessionals />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'content' && (
              <div> <CreatePost/></div>
            )}

            {activeSection === 'opportunities' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Opportunities</h2>
                  <p className="text-gray-500">Discover jobs, events and more</p>
                </div>
                
                {/* Opportunities grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Jobs Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recommended Jobs</h3>
                    
                    {jobRecommendations.length > 0 ? (
                      <div className="space-y-4">
                        {jobRecommendations.map(job => (
                          <div key={job._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow">
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                {job.location}
                              </span>
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {job.salary}
                              </span>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                              <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                                View Details
                              </button>
                              <span className="text-xs text-gray-500">
                                Posted {new Date(job.postedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        ))}
                        <Link to="/jobs" className="block text-center text-orange-500 font-medium pt-2">
                          View All Jobs →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No job recommendations available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Events Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                    
                    {events.length > 0 ? (
                      <div className="space-y-4">
                        {events.map(event => (
                          <div key={event._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow">
                            <div className="flex">
                              <div className="mr-4 flex-shrink-0">
                                <div className="h-14 w-14 rounded-lg bg-orange-100 flex flex-col items-center justify-center">
                                  <span className="text-orange-600 text-xs font-semibold">
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                  </span>
                                  <span className="text-orange-600 text-lg font-bold">
                                    {new Date(event.date).getDate()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{event.title}</h4>
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                  <span>{formatEventDate(event.date)}</span>
                                  <span className="mx-1">•</span>
                                  <span>{event.location}</span>
                                </div>
                                <div className="mt-2">
                                  <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded-md">
                                    RSVP
                                  </button>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {event.attendees} attending
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link to="/events" className="block text-center text-orange-500 font-medium pt-2">
                          View All Events →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No upcoming events</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 mt-6">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-sm">© 2023 Meetkats • Privacy Policy • Terms of Service</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;