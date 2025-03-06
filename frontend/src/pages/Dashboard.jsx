import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Navbar';
import NearbyProfessionals from '../components/network/NearbyProfessional';
import Posts from '../components/posts/Posts';
import api from '../services/api';
import StoryCard from '../components/posts/StoryCard';
import CreatePost from '../components/posts/CreatePost';
import { PlusCircle, Check, Calendar, X } from 'lucide-react';
import { useToast } from '../components/common/Toast'; // Adjust this import based on your UI library
import LocationPermissionIcon from "../commponents/LocationPermissionIcon
// Add this inside your component function

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('overview');
  const [pendingRequests, setPendingRequests] = useState(0);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 0,
    connections: 0,
    streaks: 0,
    projects: 0
  });
  const [userStreaks, setUserStreaks] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [planner, setPlanner] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Fetch all real data in parallel
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      setLoadingData(true);
      
      try {
        // Fetch all data in parallel
        const [
          profileViewData,
          connectionsData,
          pendingRequestsData,
          streaksData,
          projectsData,
          achievementsData,
          postsData
        ] = await Promise.all([
          api.getProfileViewAnalytics(),
          api.getConnections('all'),
          api.getConnectionRequests(),
          api.getUserStreaks(user._id, { limit: 5, active: true }),
          api.getUserProjects(user._id, { limit: 5 }),
          api.getUserAchievements(user._id, { limit: 3 }),
          api.getPosts({ limit: 3 })
        ]);
        
        // Update dashboard stats with real data
        setDashboardStats({
          profileViews: profileViewData.totalViews || 0,
          connections: connectionsData.length || 0,
          streaks: streaksData.items?.length || 0,
          projects: projectsData.items?.length || 0
        });
        
        // Update other state data
        setPendingRequests(pendingRequestsData.length || 0);
        setConnectionRequests(pendingRequestsData);
        setUserStreaks(streaksData.items || []);
        setUserProjects(projectsData.items || []);
        setUserAchievements(achievementsData.items || []);
        setRecentPosts(postsData.posts || []);
        
        // Load planner from local storage if exists
        const savedPlanner = localStorage.getItem('userPlanner');
        if (savedPlanner) {
          setPlanner(JSON.parse(savedPlanner));
        }
        
        setLoadingData(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, [user]);

  const handleAcceptConnection = async (userId) => {
    try {
      await api.acceptConnection(userId);
      // Update the pending requests list
      setPendingRequests(prev => prev - 1);
      // Remove the accepted request from the list
      setConnectionRequests(prev => prev.filter(req => req._id !== userId));
      // Update connections count
      setDashboardStats(prev => ({
        ...prev,
        connections: prev.connections + 1
      }));
    } catch (error) {
      console.error('Error accepting connection request:', error);
    }
  };

  const handleDeclineConnection = async (userId) => {
    try {
      await api.declineConnection(userId);
      // Update the pending requests list
      setPendingRequests(prev => prev - 1);
      // Remove the declined request from the list
      setConnectionRequests(prev => prev.filter(req => req._id !== userId));
    } catch (error) {
      console.error('Error declining connection request:', error);
    }
  };

  // Planner/To-Do list functions
  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      date: new Date().toISOString()
    };
    
    const updatedPlanner = [...planner, task];
    setPlanner(updatedPlanner);
    localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    setNewTask('');
  };

  const toggleTaskCompletion = (taskId) => {
    const updatedPlanner = planner.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setPlanner(updatedPlanner);
    localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
  };

  const deleteTask = (taskId) => {
    const updatedPlanner = planner.filter(task => task.id !== taskId);
    setPlanner(updatedPlanner);
    localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  // Fix for Dashboard.jsx component
// Replace the problematic location tracking code with this implementation

// Before (problematic code):
// const locationControl = api.startContinuousLocationUpdates({
//   interval: 30000, // 30 seconds
//   successCallback: (result) => console.log('Location updated:', result),
//   errorCallback: (error) => console.error('Location update error:', error)
// });
// 
// // Later, when user wants to stop sharing
// api.stopContinuousLocationUpdates();
// // or 
// locationControl.stop();

// After (fixed implementation):

  
  useEffect(() => {
  let locationControl = null;
  
  // Function to request location permission with toaster
  const requestLocationPermission = () => {
    toast({
      title: "Location Access Required",
      description: "This app needs access to your location for networking features. Please enable location services.",
      status: "info",
      duration: 10000,
      isClosable: true,
      action: (
        <div className="flex space-x-2">
          <button 
            onClick={() => startLocationTracking(true)} 
            className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-600 transition"
          >
            Enable
          </button>
          <button 
            onClick={() => toast.close()} 
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition"
          >
            Not Now
          </button>
        </div>
      )
    });
  };
  
  // Start location tracking with optional force param
 useEffect(() => {
  let locationControl = null;
  
  // Start location tracking when permission is granted
  const startLocationTracking = async () => {
    try {
      // Check if the user has location sharing enabled in their settings
      const settings = await api.getSettings();
      const locationEnabled = settings?.locationSharing?.enabled || false;
      
      if (!locationEnabled) {
        console.log('Location tracking disabled in user settings');
        return;
      }
      
      // Start tracking only if we have permission
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state !== 'granted') {
          console.log('Location permission not granted yet');
          return;
        }
      }
      
      console.log('Starting location tracking...');
      locationControl = api.startContinuousLocationUpdates({
        interval: 30000, // 30 seconds
        successCallback: (result) => console.log('Location updated:', result),
        errorCallback: (error) => console.error('Location update error:', error)
      });
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };
  
  // Call this once to set up initial tracking if permission is already granted
  startLocationTracking();
  
  // Set up a listener for permission changes
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        // Listen for changes
        permissionStatus.onchange = () => {
          console.log('Permission changed:', permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            startLocationTracking();
          }
        };
      })
      .catch(err => console.error('Permission query error:', err));
  }
  
  // Clean up function
  return () => {
    if (locationControl && typeof locationControl.stop === 'function') {
      console.log('Stopping location tracking');
      locationControl.stop();
    } else {
      api.stopContinuousLocationUpdates();
    }
  };
}, [user?._id]);

  if (loading || loadingData) {
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
                      {planner.filter(task => !task.completed).length} pending tasks
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
                  onClick={() => setActiveSection('portfolio')}
                  className={`flex-1 text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'portfolio'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Portfolio
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
                    <p className="text-green-600 text-sm mt-2">Career visibility</p>
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
                    <p className="text-green-600 text-sm mt-2">Network growth</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Streaks</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{dashboardStats.streaks}</h3>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-sm mt-2">Active habits</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Projects</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{dashboardStats.projects}</h3>
                      </div>
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-sm mt-2">Portfolio highlights</p>
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
                          onClick={() => navigate('/portfolio/projects/new')}
                          className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                          <span className="text-sm font-medium">Add Project</span>
                        </button>
                        
                        <button 
                          onClick={() => navigate('/portfolio/streak/new')}
                          className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-sm font-medium">Start Streak</span>
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
                        {recentPosts.length > 0 && (
                          <>
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Latest Posts</h4>
                            <div className="mb-6">
                              {recentPosts.map(post => (
                                <div key={post._id} className="mb-4 pb-4 border-b border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <div className="h-10 w-10 rounded-lg overflow-hidden mr-3">
                                      {post.author.profilePicture ? (
                                        <img 
                                          src={post.author.profilePicture} 
                                          alt={`${post.author.firstName} ${post.author.lastName}`}
                                          className="h-full w-full object-cover" 
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                          {post.author.firstName.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{post.author.firstName} {post.author.lastName}</p>
                                      <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700">{post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}</p>
                                  {post.images && post.images.length > 0 && (
                                    <div className="mt-2">
                                      <div className="h-32 rounded-lg overflow-hidden">
                                        <img 
                                          src={post.images[0].url} 
                                          alt="Post content"
                                          className="h-full w-full object-cover" 
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="mt-3 flex items-center">
                                    <Link to={`/posts/${post._id}`} className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                                      View Post
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        
                        {userAchievements.length > 0 && (
                          <>
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Recent Achievements</h4>
                            <div>
                              {userAchievements.map(achievement => (
                                <div key={achievement._id} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0">
                                  <div className="flex">
                                    <div className="flex-shrink-0 mr-3">
                                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        {achievement.image ? (
                                          <img 
                                            src={achievement.image} 
                                            alt={achievement.title}
                                            className="h-8 w-8 object-contain" 
                                          />
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-gray-800">{achievement.title}</h5>
                                      <p className="text-xs text-gray-500">{formatDate(achievement.dateAchieved)}</p>
                                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        
                        {recentPosts.length === 0 && userAchievements.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-gray-500">No recent activity to show.</p>
                            <Link to="/posts/create" className="mt-2 inline-block text-orange-500 hover:text-orange-600 font-medium">
                              Create your first post →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side - 2 columns */}
                  <div className="lg:col-span-2 space-y-6">
                    <div clasName="mx-4 my-4">
                    <LocationPermissionIcon/>
                    </div>
                    {/* User Profile Card */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="relative">
                        <div className="h-24 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                        <div className="absolute top-14 left-6">
                          <div className="h-20 w-20 rounded-lg border-4 border-white bg-white flex items-center justify-center shadow-md">
                            {user?.profilePicture ? (
                              <img
                                src={user.profilePicture}
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
                    
                    {/* My Planner / To-Do List */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">My Planner</h3>
                        <div className="text-orange-500 hover:text-orange-600 text-sm cursor-pointer">
                          <Calendar className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="p-6">
                        {/* Add new task */}
                        <div className="flex mb-4">
                          <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            onKeyPress={(e) => e.key === 'Enter' && addTask()}
                          />
                          <button
                            onClick={addTask}
                            className="bg-orange-500 text-white rounded-r-md px-4 py-2 text-sm hover:bg-orange-600 transition"
                          >
                            <PlusCircle className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Task list */}
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {planner.length === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-gray-500">No tasks yet. Add your first task above.</p>
                            </div>
                          ) : (
                            planner.map(task => (
                              <div 
                                key={task.id} 
                                className={`flex items-center justify-between p-3 border rounded-md ${
                                  task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-center flex-1">
                                  <button
                                    onClick={() => toggleTaskCompletion(task.id)}
                                    className={`flex-shrink-0 h-5 w-5 rounded-full border ${
                                      task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                    } mr-3 flex items-center justify-center`}
                                  >
                                    {task.completed && <Check className="h-3 w-3 text-white" />}
                                  </button>
                                  <div className="flex-1">
                                    <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                      {task.text}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Added {formatDate(task.date)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="ml-2 text-gray-400 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Active Streaks */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Active Streaks</h3>
                        <Link to="/portfolio/streaks" className="text-orange-500 hover:text-orange-600 text-sm">View All</Link>
                      </div>
                      <div className="p-6 space-y-4">
                        {userStreaks.length > 0 ? (
                          userStreaks.map(streak => (
                            <div key={streak._id} className="flex">
                              <div className="mr-4 flex-shrink-0">
                                <div className="h-14 w-14 rounded-lg bg-green-100 flex flex-col items-center justify-center">
                                  <span className="text-green-600 text-xs font-semibold">
                                    Day
                                  </span>
                                  <span className="text-green-600 text-lg font-bold">
                                    {streak.currentStreak || 0}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">{streak.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{streak.activity}</p>
                                <div className="mt-2">
                                  <Link 
                                    to={`/portfolio/streaks/${streak._id}`}
                                    className="inline-block bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full"
                                  >
                                    Check In
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <p className="text-sm text-gray-500">No active streaks</p>
                            <Link 
                              to="/portfolio/streak/new" 
                              className="mt-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
                            >
                              Start a Streak →
                            </Link>
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
                        {connectionRequests.map(request => (
                          <div key={request._id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl mr-3">
                                {request.profilePicture ? (
                                  <img 
                                    src={request.profilePicture} 
                                    alt={`${request.firstName} ${request.lastName}`} 
                                    className="h-12 w-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  request.firstName.charAt(0)
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium">{request.firstName} {request.lastName}</h4>
                                <p className="text-sm text-gray-500">{request.headline || 'Professional'}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleAcceptConnection(request._id)}
                                className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleDeclineConnection(request._id)}
                                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"
                              >
                                Ignore
                              </button>
                            </div>
                          </div>
                        ))}
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

            {activeSection === 'portfolio' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Your Portfolio</h2>
                  <p className="text-gray-500">Manage your projects, streaks, and achievements</p>
                </div>
                
                {/* Portfolio dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Projects Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                    
                    {userProjects.length > 0 ? (
                      <div className="space-y-4">
                        {userProjects.map(project => (
                          <div key={project._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow">
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {project.description?.length > 100 
                                ? project.description.substring(0, 100) + '...' 
                                : project.description}
                            </p>
                            <div className="mt-3 flex justify-between items-center">
                              <Link 
                                to={`/portfolio/projects/${project._id}`}
                                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                              >
                                View Details
                              </Link>
                              <span className="text-xs text-gray-500">
                                {formatDate(project.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <Link to="/portfolio/projects" className="block text-center text-orange-500 font-medium pt-2">
                          View All Projects →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No projects yet</p>
                        <Link 
                          to="/portfolio/projects/new" 
                          className="mt-2 inline-block text-orange-500 hover:text-orange-600 text-sm font-medium"
                        >
                          Create Your First Project →
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {/* Achievements Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
                    
                    {userAchievements.length > 0 ? (
                      <div className="space-y-4">
                        {userAchievements.map(achievement => (
                          <div key={achievement._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow">
                            <div className="flex">
                              <div className="mr-4 flex-shrink-0">
                                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                  {achievement.image ? (
                                    <img 
                                      src={achievement.image} 
                                      alt={achievement.title}
                                      className="h-8 w-8 object-contain" 
                                    />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                                <p className="text-xs text-gray-500">{formatDate(achievement.dateAchieved)}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {achievement.description?.length > 100 
                                    ? achievement.description.substring(0, 100) + '...' 
                                    : achievement.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link to="/portfolio/achievements" className="block text-center text-orange-500 font-medium pt-2">
                          View All Achievements →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No achievements yet</p>
                        <Link 
                          to="/portfolio/achievements/new" 
                          className="mt-2 inline-block text-orange-500 hover:text-orange-600 text-sm font-medium"
                        >
                          Add Your First Achievement →
                        </Link>
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
