import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import NearbyProfessionals from '../components/network/NearbyProfessional';
import api from '../services/api';

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [pendingRequests, setPendingRequests] = useState(0);
  const [posts, setPosts] = useState([]);
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

  // Fetch posts for the feed
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      
      try {
        setLoadingPosts(true);
        // This would be an API call to get posts in a real implementation
        // For now we'll use mock data
        const mockPosts = [
          {
            _id: '1',
            author: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePicture: user.profilePicture,
              headline: user.headline || 'Professional at Company'
            },
            content: 'Welcome to ProfNet! This is a sample post to get you started.',
            likes: 12,
            comments: 3,
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            author: {
              _id: 'user123',
              firstName: 'Jane',
              lastName: 'Smith',
              profilePicture: null,
              headline: 'Product Manager at Tech Co'
            },
            content: 'Just launched a new feature! Check out our latest product update that helps professionals connect more effectively.',
            likes: 24,
            comments: 5,
            createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          }
        ];
        
        setPosts(mockPosts);
        setLoadingPosts(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [user]);

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

  // Format the date for posts
  const formatPostDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return 'just now';
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`${
                activeTab === 'home'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Home
            </button>
            <button
              onClick={() => navigate('/network')}
              className={`whitespace-nowrap py-4 px-1 border-transparent border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center`}
            >
              My Network
              {pendingRequests > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {pendingRequests}
                </span>
              )}
            </button>
            {/* <button
              onClick={() => navigate('/jobs')}
              className={`whitespace-nowrap py-4 px-1 border-transparent border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300`}
            >
              Jobs
            </button> */}
            <button
              onClick={() => navigate('/chat')}
              className={`whitespace-nowrap py-4 px-1 border-transparent border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300`}
            >
              Messaging
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className={`whitespace-nowrap py-4 px-1 border-transparent border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300`}
            >
              Notifications
            </button>
          </nav>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="bg-blue-600 h-24 relative">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="absolute bottom-0 transform translate-y-1/2 left-4 w-20 h-20 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="absolute bottom-0 transform translate-y-1/2 left-4 w-20 h-20 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-gray-600">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-14 pb-6 px-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-500 mt-1">{user?.headline || 'Add a professional headline'}</p>
                <p className="text-gray-500 text-sm mt-2">{user?.industry || 'Add your industry'}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/profile"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Your Network</h3>
                <dl className="mt-2 divide-y divide-gray-200">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Connections</dt>
                    <dd className="text-sm font-medium text-gray-900">{user?.connections?.length || 0}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Followers</dt>
                    <dd className="text-sm font-medium text-gray-900">{user?.followers?.length || 0}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Following</dt>
                    <dd className="text-sm font-medium text-gray-900">{user?.following?.length || 0}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <Link
                    to="/network"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage your network
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Events Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-4 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {events.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No upcoming events
                  </div>
                ) : (
                  events.map(event => (
                    <div key={event._id} className="p-4 hover:bg-gray-50">
                      <h4 className="font-medium text-blue-600 hover:underline">{event.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.date).toLocaleDateString()} • {event.location}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.attendees} attendees
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right">
                <Link
                  to="/events"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all events
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Post Input */}
            <div className="bg-white shadow rounded-lg mb-6 p-4">
              <div className="flex space-x-4">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <button
                    className="border border-gray-300 bg-white rounded-full text-gray-500 w-full p-2.5 text-left hover:bg-gray-50 focus:outline-none"
                    onClick={() => alert('Post creation would be implemented in a production app')}
                  >
                    Start a post
                  </button>
                </div>
              </div>
              <div className="flex justify-between mt-3">
                <button className="flex items-center text-gray-600 hover:text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4a.5.5 0 01-.5-.5v-6.813l2.646 3.773a1 1 0 001.633.006L10 7l2.022 2.065a1 1 0 001.414 0l3.113-3.113v6.548a.5.5 0 01-.5.5zM4 4.5h12a.5.5 0 01.5.5v1.84l-3.827 3.827a.25.25 0 01-.354 0L10.292 8.64a1 1 0 00-1.437.038L6.5 12.293l-3-.001V5a.5.5 0 01.5-.5z" clipRule="evenodd" />
                  </svg>
                  Photo
                </button>
                <button className="flex items-center text-gray-600 hover:text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5zm3 2a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 100 2h7a1 1 0 100-2H8z" clipRule="evenodd" />
                  </svg>
                  Article
                </button>
                <button className="flex items-center text-gray-600 hover:text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                  </svg>
                  Event
                </button>
              </div>
            </div>

            {/* Feed - Posts */}
            {loadingPosts ? (
              <div className="space-y-6">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white shadow rounded-lg">
                    <div className="p-4 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">No posts in your feed yet</p>
                <p className="text-sm text-gray-500 mt-1">Connect with more professionals to see their updates</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <div key={post._id} className="bg-white shadow rounded-lg">
                    <div className="p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          {post.author.profilePicture ? (
                            <img
                              src={post.author.profilePicture}
                              alt={`${post.author.firstName} ${post.author.lastName}`}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-600">
                                {post.author.firstName?.charAt(0)}
                                {post.author.lastName?.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {post.author.firstName} {post.author.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{post.author.headline}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatPostDate(post.createdAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-900">{post.content}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <button className="flex items-center hover:text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          Like • {post.likes}
                        </button>
                        <button className="flex items-center hover:text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                          </svg>
                          Comment • {post.comments}
                        </button>
                        <button className="flex items-center hover:text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="md:col-span-1">
            {/* Nearby Professionals Section */}
            <NearbyProfessionals user={user} />
            
            {/* Job Recommendations
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-4 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recommended Jobs</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {jobRecommendations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No job recommendations yet
                  </div>
                ) : (
                  jobRecommendations.map(job => (
                    <div key={job._id} className="p-4 hover:bg-gray-50">
                      <h4 className="font-medium text-blue-600 hover:underline">{job.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{job.company}</p>
                      <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                      {job.salary && (
                        <p className="text-sm text-gray-500 mt-1">{job.salary}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Posted {formatPostDate(job.postedDate)}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right">
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all jobs
                </Link>
              </div>
            </div> */}
            
            {/* Chat Button */}
            <Link 
              to="/chat" 
              className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;