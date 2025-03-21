import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Navbar'; // Note: Component naming mismatch
import NearbyProfessionals from '../components/network/NearbyProfessional';
import Posts from '../components/posts/Posts';
import api from '../services/api';
import StoryCard from '../components/posts/StoryCard';
import CreatePost from '../components/posts/CreatePost';
import { PlusCircle, Check, Calendar, X, User } from 'lucide-react';
import { useToast } from '../components/common/Toast';
import LocationPermissionIcon from '../components/LocationPermissionIcon';
import { MapPin, Users, ChevronRight, Search, Filter, UserPlus, Rss, Home, Bell, MessageCircle, Briefcase, Settings, LogOut } from 'lucide-react';
// Add default profile picture
import defaultProfilePic from '../assets/default-avatar.png';

const Dashboard = () => {
  const [loadingState, setLoadingState] = useState({
    nearby: false,
    connections: false,
    data: true
  });

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const locationControlRef = useRef(null);
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
  const [userLocation, setUserLocation] = useState(null);
  const initialLoadTimer = useRef(null);
// Fixed code for the nearby professionals card in Dashboard.jsx
// This function safely formats the distance value to avoid the TypeError

// Add this helper function at the start of your Dashboard component
const formatDistance = (distance) => {
  try {
    // Check if distance is a valid number
    if (typeof distance === 'number' && !isNaN(distance)) {
      // Format based on distance magnitude
      return distance < 1 
        ? `${(distance * 1000).toFixed(0)}m` 
        : `${distance.toFixed(1)}km`;
    }
    
    // Handle string values that can be parsed to numbers
    if (typeof distance === 'string') {
      const parsedDist = parseFloat(distance);
      if (!isNaN(parsedDist)) {
        return parsedDist < 1 
          ? `${(parsedDist * 1000).toFixed(0)}m` 
          : `${parsedDist.toFixed(1)}km`;
      }
    }
    
    // Default case: when distance is undefined, null, or cannot be parsed
    return 'nearby';
  } catch (error) {
    console.error('Error formatting distance:', error);
    return 'nearby';
  }
};

// Then replace the distance badge code in your component with this:
{user.distance !== undefined && (
  <div className="absolute top-2 right-2 bg-white px-2 py-0.5 md:py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
    {formatDistance(user.distance)}
  </div>
)}
  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    // Force loading to complete after 10 seconds no matter what
    initialLoadTimer.current = setTimeout(() => {
      if (loadingState.data || loadingData) {
        console.log('Safety timeout triggered - forcing loading to complete');
        setLoadingState(prev => ({ ...prev, data: false }));
        setLoadingData(false);
      }
    }, 10000); // 10 seconds timeout

    return () => {
      if (initialLoadTimer.current) {
        clearTimeout(initialLoadTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    // Get user's location and fetch both types of users simultaneously
    // Using a try-catch to make sure any errors here don't block the entire component
    try {
      getUserLocation();
    } catch (error) {
      console.error('Error in getUserLocation:', error);
      // Ensure location loading state is set to false
      setLoadingState(prev => ({ ...prev, nearby: false }));
    }
    
    // Fetch all dashboard data when component mounts
    fetchAllData();
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Extra safety check to load data once user is available
  useEffect(() => {
    if (user && user._id && loadingData) {
      fetchAllData();
    }
  }, [user]);

  // Location tracking implementation
  useEffect(() => {
    // Skip if user is not logged in
    if (!user || !user._id) return;
    
    const startLocationTracking = async () => {
      try {
        // Check if we have permission first
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          
          if (permission.state !== 'granted') {
            console.log('Location permission not granted');
            setLocationEnabled(false);
            return;
          }
        }
        
        console.log('Starting location tracking...');
        
        // Location tracking options with reasonable timeouts
        const trackingOptions = {
          interval: 30000, // 30 seconds
          enableHighAccuracy: false, // Set to false for battery saving
          timeout: 5000, // 5 second timeout
          maximumAge: 300000, // 5 minutes
          successCallback: (result) => {
            console.log('Location updated successfully');
            setLocationEnabled(true);
          },
          errorCallback: (error) => {
            console.error('Location update error:', error);
            // Only show error message for permanent errors, not timeouts
            if (error.code !== error.TIMEOUT) {
              setLocationEnabled(false);
            }
          }
        };
        
        // Start tracking and store the control object
        locationControlRef.current = api.startContinuousLocationUpdates(trackingOptions);
      } catch (error) {
        console.error('Error setting up location tracking:', error);
        setLocationEnabled(false);
      }
    };
    
    // Start tracking
    startLocationTracking();
    
    // Clean up function
    return () => {
      if (locationControlRef.current && typeof locationControlRef.current.stop === 'function') {
        console.log('Stopping location tracking');
        locationControlRef.current.stop();
        locationControlRef.current = null;
      }
    };
  }, [user?._id]);

  const getUserLocation = () => {
    setLoadingState(prev => ({ ...prev, nearby: true }));
    
    if (navigator.geolocation) {
      // Add options to the geolocation request
      const options = {
        enableHighAccuracy: false, // Set to false for faster response
        timeout: 5000, // 5 seconds timeout (shorter timeout to prevent blocking)
        maximumAge: 300000 // Cache position for 5 minutes
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          fetchNearbyUsers(latitude, longitude, 10); // Default 10km radius
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Handle timeout error gracefully and ensure loading state gets reset
          if (error.code === error.TIMEOUT) {
            console.log('Location request timed out, using fallback');
            toast({
              title: "Location request timed out",
              description: "Showing recommended professionals instead.",
              status: "warning",
              duration: 3000,
            });
          }
          
          // Continue loading nearby users without location, regardless of error type
          fetchNearbyUsers(null, null, 50);
        },
        options // Pass the options object
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLoadingState(prev => ({ ...prev, nearby: false }));
      
      // Continue loading nearby users without location
      fetchNearbyUsers(null, null, 50);
    }
  };

// Enhanced fetchNearbyUsers function with robust data handling for the Dashboard component

// Updated fetchNearbyUsers function to handle missing/invalid location and fix the distance error
const fetchNearbyUsers = async (latitude, longitude, distance) => {
  try {
    setLoadingState(prev => ({ ...prev, nearby: true }));
    
    // Modify API call to handle missing location
    let nearbyResponse = [];
    
    try {
      if (latitude && longitude) {
        nearbyResponse = await api.getNearbyProfessionals(distance, latitude, longitude);
      } else {
        // Try recommended professionals first
        try {
          nearbyResponse = await api.getRecommendedProfessionals({ limit: 10 });
        } catch (recError) {
          console.log('Recommended professionals API failed, trying generic professionals', recError);
          // Fall back to generic professionals
          nearbyResponse = await api.getProfessionals({ limit: 10 });
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(nearbyResponse)) {
        console.warn('API response is not an array, using empty array instead');
        nearbyResponse = [];
      }
    } catch (apiError) {
      console.error('All professionals API calls failed:', apiError);
      nearbyResponse = [];
    }
    
    // Now fetch connections in a separate call
    let connections = [];
    let following = [];
    try {
      // Get connections
      connections = await api.getConnections('all');
      if (!Array.isArray(connections)) {
        connections = [];
      }
      
      // Get following data from user object
      following = user?.following || [];
      
    } catch (connectionError) {
      console.error('Error fetching connections or following:', connectionError);
      connections = [];
      following = [];
    }
    
    // Create a Set of connection IDs for faster lookup
    const connectionIds = new Set(connections.map(conn => conn._id || ''));
    
    // Handle following data based on structure
    const followingIds = new Set();
    if (following && following.length > 0) {
      if (typeof following[0] === 'object') {
        following.forEach(f => f?._id && followingIds.add(f._id));
      } else {
        following.forEach(id => id && followingIds.add(id.toString()));
      }
    }
    
    // Get pending connections
    let pendingConnections = [];
    try {
      pendingConnections = await api.getPendingConnections();
      if (!Array.isArray(pendingConnections)) {
        pendingConnections = [];
      }
    } catch (error) {
      console.error('Error fetching pending connections:', error);
      pendingConnections = [];
    }
    
    const pendingIds = new Set(pendingConnections.map(conn => 
      typeof conn === 'string' ? conn : conn?._id || ''
    ));
    
    // Enhance users with connection status, following status, and SAFE distance formatting
    const enhancedUsers = nearbyResponse.map(user => {
      // Format distance properly to avoid TypeError
      let formattedDistance = 'nearby';
      try {
        if (user.distance !== undefined) {
          // Ensure distance is a number
          const distValue = typeof user.distance === 'string' 
            ? parseFloat(user.distance) 
            : user.distance;
            
          if (!isNaN(distValue)) {
            formattedDistance = distValue < 1 
              ? `${(distValue * 1000).toFixed(0)}m away` 
              : `${distValue.toFixed(1)}km away`;
          }
        }
      } catch (distError) {
        console.error('Error formatting distance for user:', user._id, distError);
      }
      
      return {
        ...user,
        connectionStatus: connectionIds.has(user._id) 
          ? 'connected' 
          : pendingIds.has(user._id)
            ? 'pending'
            : 'none',
        isFollowing: followingIds.has(user._id),
        // Add the pre-formatted distance to avoid errors in rendering
        formattedDistance,
        // Ensure distance is a number for comparisons
        distance: typeof user.distance === 'string' 
          ? parseFloat(user.distance) || null
          : (user.distance ?? null)
      };
    });
    
    // Filter out users who are in your connections
    const filteredUsers = enhancedUsers.filter(user => 
      user._id && user.connectionStatus !== 'connected'
    );
    
    // Take the first 3 users to display
    setNearbyUsers(filteredUsers.slice(0, 3));
    
  } catch (error) {
    console.error('Error in fetchNearbyUsers:', error);
    setNearbyUsers([]);
  } finally {
    // Always reset loading state
    setLoadingState(prev => ({ ...prev, nearby: false }));
  }
};

  // Update fetchAllData to use the new loading state
  const fetchAllData = async () => {
    if (!user || !user._id) {
      console.log('fetchAllData: No user or user ID, skipping');
      return;
    }
    
    setLoadingState(prev => ({ ...prev, data: true }));
    
    try {
      // Fetch all data in parallel but with individual try-catch blocks for each call
      let profileViewData = { totalViews: 0 };
      let connectionsData = [];
      let pendingRequestsData = [];
      let streaksData = { items: [] };
      let projectsData = { items: [] };
      let achievementsData = { items: [] };
      let postsData = { posts: [] };
      
      try {
        profileViewData = await api.getProfileViewAnalytics();
      } catch (error) {
        console.error('Error fetching profile views:', error);
      }
      
      try {
        connectionsData = await api.getConnections('all') || [];
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
      
      try {
        pendingRequestsData = await api.getConnectionRequests() || [];
      } catch (error) {
        console.error('Error fetching connection requests:', error);
      }
      
      try {
        streaksData = await api.getUserStreaks(user._id, { limit: 5, active: true }) || { items: [] };
      } catch (error) {
        console.error('Error fetching streaks:', error);
      }
      
      try {
        projectsData = await api.getUserProjects(user._id, { limit: 5 }) || { items: [] };
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      
      try {
        achievementsData = await api.getUserAchievements(user._id, { limit: 3 }) || { items: [] };
      } catch (error) {
        console.error('Error fetching achievements:', error);
      }
      
      try {
        postsData = await api.getPosts({ limit: 3 }) || { posts: [] };
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
      
      // Update dashboard stats with real data
      setDashboardStats({
        profileViews: profileViewData?.totalViews || 0,
        connections: connectionsData?.length || 0,
        streaks: streaksData?.items?.length || 0,
        projects: projectsData?.items?.length || 0
      });
      
      // Update other state data - add null checks
      setPendingRequests(pendingRequestsData?.length || 0);
      setConnectionRequests(pendingRequestsData || []);
      setUserStreaks(streaksData?.items || []);
      setUserProjects(projectsData?.items || []);
      setUserAchievements(achievementsData?.items || []);
      setRecentPosts(postsData?.posts || []);
      
      // Load planner from local storage if exists
      try {
        const savedPlanner = localStorage.getItem('userPlanner');
        if (savedPlanner) {
          setPlanner(JSON.parse(savedPlanner));
        }
      } catch (error) {
        console.error('Error loading planner from local storage:', error);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      // Always update loading state, even on error
      setLoadingState(prev => ({ ...prev, data: false }));
      setLoadingData(false); 
    }
  };

  const handleConnect = async (userId) => {
    try {
      // Show loading state or disable button if needed
      
      // Send connection request
      await api.sendConnectionRequest(userId);
      
      // Update the UI to show pending status
      setNearbyUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, connectionStatus: 'pending' }
            : user
        )
      );
      
      // Show success toast
      toast({
        title: "Connection request sent!",
        description: "We'll notify you when they respond.",
        status: "success"
      });
    } catch (error) {
      console.error('Error sending connection request:', error);
      
      // Show error toast
      toast({
        title: "Request failed",
        description: "Couldn't send connection request. Please try again.",
        status: "error"
      });
    }
  };

  const handleFollow = async (userId) => {
    try {
      // Send follow request
      const response = await api.followUser(userId);
      
      // Update UI based on new following status
      setNearbyUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: response.following }
            : user
        )
      );
      
      // Show success toast
      toast({
        title: response.following ? "Following user" : "Unfollowed user",
        status: "success"
      });
    } catch (error) {
      console.error('Error following user:', error);
      
      // Show error toast
      toast({
        title: "Action failed",
        description: "Couldn't update follow status. Please try again.",
        status: "error"
      });
    }
  };

  const getProfilePicture = (userObj) => {
    if (userObj?.profilePicture) {
      return userObj.profilePicture;
    }
    return defaultProfilePic;
  };

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
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Fix the loading condition by checking both loading states
  if (loading || loadingState.data) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-orange-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-orange-50">
      {/* Sidebar - hidden on mobile, visible on md and up */}
      <div className="hidden md:block">
        <Sidebar user={user} onLogout={logout} />
      </div>
      
      {/* Mobile Navbar - visible only on small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
        <div className="flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => setActiveSection('overview')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'overview' ? 'text-orange-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => setActiveSection('network')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'network' ? 'text-orange-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs">Network</span>
          </button>
          <button 
            onClick={() => setActiveSection('content')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'content' ? 'text-orange-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-xs">Create</span>
          </button>
          <button 
            onClick={() => setActiveSection('portfolio')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'portfolio' ? 'text-orange-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs">Portfolio</span>
          </button>
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center p-2 text-gray-500"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="md:pl-0 pl-0 md:pt-0 pt-4">
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
                      <h1 className="text-xl md:text-2xl font-bold text-gray-800">Hello, {user?.firstName || 'User'}!</h1>
                      <p className="text-sm md:text-base text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 w-full md:w-auto">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/connections`}>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-md text-sm font-medium">
                        {pendingRequests} connection requests
                      </span>
                    </Link>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
                      {planner.filter(task => !task.completed).length} pending tasks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs Navigation - Scrollable on mobile */}
            <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden border-b">
              <div className="flex overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`flex-none text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'overview'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection('network')}
                  className={`flex-none text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'network'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Network
                </button>
                <button
                  onClick={() => setActiveSection('content')}
                  className={`flex-none text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeSection === 'content'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setActiveSection('portfolio')}
                  className={`flex-none text-center py-4 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
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
                {/* Stats Cards - Responsive grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow p-3 md:p-5 border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-xs md:text-sm">Profile Views</p>
                        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mt-1">{dashboardStats.profileViews}</h3>
                      </div>
                      <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-xs md:text-sm mt-2">Career visibility</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-3 md:p-5 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-xs md:text-sm">Connections</p>
                        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mt-1">{dashboardStats.connections}</h3>
                      </div>
                      <div className="bg-blue-100 p-1.5 md:p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-xs md:text-sm mt-2">Network growth</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-3 md:p-5 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-xs md:text-sm">Streaks</p>
                        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mt-1">{dashboardStats.streaks}</h3>
                      </div>
                      <div className="bg-green-100 p-1.5 md:p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-xs md:text-sm mt-2">Active habits</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow p-3 md:p-5 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-xs md:text-sm">Projects</p>
                        <h3 className="text-xl md:text-3xl font-bold text-gray-800 mt-1">{dashboardStats.projects}</h3>
                      </div>
                      <div className="bg-purple-100 p-1.5 md:p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-xs md:text-sm mt-2">Portfolio highlights</p>
                  </div>
                </div>

                {/* Responsive Dashboard Layout - Stack on mobile, two columns on larger screens */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Side - Full width on mobile, 3 columns on larger screens */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-4 md:px-6 py-4">
                        <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                      </div>
                      <div className="p-4 md:p-6 grid grid-cols-3 gap-2 md:gap-4">
                        <button 
                          onClick={() => navigate('/posts/create')}
                          className="flex flex-col items-center justify-center bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg p-2 md:p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-xs md:text-sm font-medium">Create Post</span>
                        </button>
                        
                        <button 
                          onClick={() => navigate('/portfolio/projects/new')}
                          className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-2 md:p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                          <span className="text-xs md:text-sm font-medium">Add Project</span>
                        </button>
                        
                        <button 
                          onClick={() => navigate('/portfolio/streak/new')}
                          className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg p-2 md:p-4 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-xs md:text-sm font-medium">Start Streak</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Stories */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Stories</h3>
                        <Link to="/stories" className="text-orange-500 hover:text-orange-600 text-xs md:text-sm">View All</Link>
                      </div>
                      <div className="p-4 md:p-6">
                        <StoryCard />
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                        <button className="text-gray-500 hover:text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-4 md:p-6">
                        {recentPosts.length > 0 && (
                          <>
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Latest Posts</h4>
                            <div className="mb-6">
                              {recentPosts.map(post => (
                                <div key={post._id} className="mb-4 pb-4 border-b border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg overflow-hidden mr-2 md:mr-3">
                                      {post.author && (
                                        <img 
                                          src={getProfilePicture(post.author)}
                                          alt={`${post.author?.firstName || 'User'} ${post.author?.lastName || ''}`}
                                          className="h-full w-full object-cover" 
                                        />
                                      )}
                                    </div>
                                    <div>
                                      {post.author && (
                                        <p className="font-medium text-xs md:text-sm">
                                          {post.author?.firstName || 'User'} {post.author?.lastName || ''}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                                    </div>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-700">{post.content?.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</p>
                                  {post.images && post.images.length > 0 && (
                                    <div className="mt-2">
                                      <div className="h-24 md:h-32 rounded-lg overflow-hidden">
                                        <img 
                                          src={post.images[0].url} 
                                          alt="Post content"
                                          className="h-full w-full object-cover" 
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="mt-3 flex items-center">
                                    <Link to={`/posts/${post._id}`} className="text-xs md:text-sm text-orange-500 hover:text-orange-600 font-medium">
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
                                      <div className="h-10 w-10 md:h-12 md:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        {achievement.image ? (
                                          <img 
                                            src={achievement.image} 
                                            alt={achievement.title || 'Achievement'}
                                            className="h-6 w-6 md:h-8 md:w-8 object-contain" 
                                          />
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-sm md:text-base text-gray-800">{achievement.title || 'Untitled Achievement'}</h5>
                                      <p className="text-xs text-gray-500">{formatDate(achievement.dateAchieved)}</p>
                                      <p className="text-xs md:text-sm text-gray-600 mt-1">{achievement.description || ''}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        
                        {recentPosts.length === 0 && userAchievements.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-gray-500 text-sm">No recent activity to show.</p>
                            <Link to="/posts/create" className="mt-2 inline-block text-orange-500 hover:text-orange-600 text-sm font-medium">
                              Create your first post →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side - Full width on mobile, 2 columns on larger screens */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="mx-4 my-4">
                      <LocationPermissionIcon/>
                    </div>
                    {/* User Profile Card */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="relative">
                        <div className="h-20 md:h-24 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                        <div className="absolute top-12 md:top-14 left-4 md:left-6">
                          <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg border-4 border-white bg-white flex items-center justify-center shadow-md overflow-hidden">
                            <img
                              src={getProfilePicture(user)}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-12 md:pt-14 pb-5 px-4 md:px-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900">
                              {user?.firstName || 'User'} {user?.lastName || ''}
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500">{user?.headline || 'Professional Title'}</p>
                          </div>
                          <Link 
                            to="/profile" 
                            className="text-orange-500 hover:text-orange-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>
                        </div>
                        
                        <div className="mt-4 md:mt-6 bg-orange-50 rounded-lg p-3 md:p-4">
                          <div className="text-xs md:text-sm">
                            <p className="font-medium text-gray-900">Profile Completion: 68%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5 mt-2">
                              <div className="bg-orange-500 h-2 md:h-2.5 rounded-full" style={{ width: '68%' }}></div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Link 
                              to="/profile/edit" 
                              className="text-orange-600 text-xs md:text-sm font-medium hover:text-orange-700"
                            >
                              Complete your profile →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* My Planner / To-Do List */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">My Planner</h3>
                        <div className="text-orange-500 hover:text-orange-600 text-sm cursor-pointer">
                          <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        {/* Add new task */}
                        <div className="flex mb-4">
                          <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            onKeyPress={(e) => e.key === 'Enter' && addTask()}
                          />
                          <button
                            onClick={addTask}
                            className="bg-orange-500 text-white rounded-r-md px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-orange-600 transition"
                          >
                            <PlusCircle className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        </div>

                        {/* Task list */}
                        <div className="space-y-2 max-h-60 md:max-h-72 overflow-y-auto">
                          {planner.length === 0 ? (
                            <div className="text-center py-4 md:py-6">
                              <p className="text-gray-500 text-xs md:text-sm">No tasks yet. Add your first task above.</p>
                            </div>
                          ) : (
                            planner.map(task => (
                              <div 
                                key={task.id} 
                                className={`flex items-center justify-between p-2 md:p-3 border rounded-md ${
                                  task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <button
                                    onClick={() => toggleTaskCompletion(task.id)}
                                    className={`flex-shrink-0 h-4 w-4 md:h-5 md:w-5 rounded-full border ${
                                      task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                    } mr-2 md:mr-3 flex items-center justify-center`}
                                  >
                                    {task.completed && <Check className="h-2 w-2 md:h-3 md:w-3 text-white" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs md:text-sm truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                      {task.text}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      Added {formatDate(task.date)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                                >
                                  <X className="h-3 w-3 md:h-4 md:w-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Active Streaks */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Active Streaks</h3>
                        <Link to="/portfolio/streaks" className="text-orange-500 hover:text-orange-600 text-xs md:text-sm">View All</Link>
                      </div>
                      <div className="p-4 md:p-6 space-y-4">
                        {userStreaks.length > 0 ? (
                          userStreaks.map(streak => (
                            <div key={streak._id} className="flex">
                              <div className="mr-3 md:mr-4 flex-shrink-0">
                                <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg bg-green-100 flex flex-col items-center justify-center">
                                  <span className="text-green-600 text-xs font-semibold">
                                    Day
                                  </span>
                                  <span className="text-green-600 text-base md:text-lg font-bold">
                                    {streak.currentStreak || 0}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs md:text-sm font-semibold text-gray-900">{streak.title || 'Streak'}</h4>
                                <p className="text-xs text-gray-500 mt-1">{streak.activity || ''}</p>
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
                          <div className="text-center py-4 md:py-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-gray-300 mx-auto mb-2 md:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <p className="text-xs md:text-sm text-gray-500">No active streaks</p>
                            <Link 
                              to="/portfolio/streak/new" 
                              className="mt-2 text-orange-500 hover:text-orange-600 text-xs md:text-sm font-medium"
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
              <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                <div className="mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Your Network</h2>
                  <p className="text-sm text-gray-500">Connect with professionals in your field</p>
                </div>
                
                {/* Connection requests and nearby professionals - stack on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-orange-50 rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Connection Requests</h3>
                    {pendingRequests > 0 ? (
                      <div className="space-y-3 md:space-y-4">
                        {connectionRequests.map(request => (
                          <div key={request._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center mb-2 sm:mb-0">
                              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl mr-3">
                                <img 
                                  src={getProfilePicture(request)} 
                                  alt={`${request?.firstName || 'User'} ${request?.lastName || ''}`} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm md:text-base">{request?.firstName || 'User'} {request?.lastName || ''}</h4>
                                <p className="text-xs md:text-sm text-gray-500">{request?.headline || 'Professional'}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleAcceptConnection(request._id)}
                                className="bg-orange-500 text-white px-2 md:px-3 py-1 rounded-md text-xs md:text-sm"
                              >
                               Accept
                              </button>
                              <button 
                                onClick={() => handleDeclineConnection(request._id)}
                                className="bg-gray-200 text-gray-700 px-2 md:px-3 py-1 rounded-md text-xs md:text-sm"
                              >
                                Ignore
                              </button>
                            </div>
                          </div>
                        ))}
                        <Link to="/network" className="block w-full text-center text-orange-500 font-medium mt-4 text-sm">
                          View All Requests →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4 md:py-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-gray-300 mx-auto mb-2 md:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-sm text-gray-500">No pending requests</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Nearby Professionals with Improved Card Width for Laptops - All Styles Inline */}
                  <div className="bg-white rounded-xl shadow-md p-3 md:p-6 mb-4">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-orange-500 mr-2" />
                        <h2 className="text-base md:text-xl font-semibold text-gray-800">Nearby Professionals</h2>
                      </div>
                      <Link to="/network/nearby" className="text-xs md:text-sm text-orange-500 hover:text-orange-600 flex items-center">
                        See All <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                      </Link>
                    </div>

                    {/* User Cards - Fixed overlapping issue */}
                    {loadingState.nearby ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                      </div>
                    ) : nearbyUsers && nearbyUsers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {nearbyUsers.map(user => (
                          <div key={user._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex flex-col w-full">
                            {/* Card Header with gradient background and distance badge */}
                            <div className="h-16 sm:h-20 md:h-24 bg-gradient-to-r from-orange-100 to-orange-200 relative w-full">
                              {user.distance !== undefined && (
                                <div className="absolute top-2 right-2 bg-white px-2 py-0.5 md:py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                  {user.distance < 1 ? `${(user.distance * 1000).toFixed(0)}m` : `${user.distance.toFixed(1)}km`} away
                                </div>
                              )}
                            </div>
                            
                            {/* User Info Section - Fixed overlapping issues */}
                            <div className="p-3 sm:p-4 md:p-5 relative flex-grow w-full">
                              {/* Profile Picture - Adjusted size and positioning */}
                              <div className="absolute -top-10 sm:-top-11 md:-top-12 left-3 md:left-4 border-3 md:border-4 border-white rounded-full">
                                {user.profilePicture ? (
                                  <img 
                                    src={user.profilePicture} 
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="h-16 sm:h-16 md:h-20 w-16 sm:w-16 md:w-20 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-16 sm:h-16 md:h-20 w-16 sm:w-16 md:w-20 rounded-full bg-orange-100 flex items-center justify-center">
                                    <span className="text-lg md:text-xl font-medium text-orange-600">
                                      {user.firstName?.charAt(0) || ''}
                                      {user.lastName?.charAt(0) || ''}
                                    </span>
                                  </div>
                                )}
                                {/* Online indicator */}
                                {user.online && (
                                  <div className="absolute bottom-0 right-0 h-3 w-3 md:h-4 md:w-4 rounded-full bg-green-500 border-2 border-white"></div>
                                )}
                              </div>
                              
                              {/* User Details - Fixed min-height causing overlap */}
                              <div className="mt-8 sm:mt-9 md:mt-10 w-full" style={{ minHeight: '100px' }}>
                                <h3 
                                  className="text-base md:text-lg font-medium text-gray-900 hover:text-orange-600 cursor-pointer truncate w-full"
                                  onClick={() => navigate(`/profile/${user._id}`)}
                                >
                                  {user.firstName || ''} {user.lastName || ''}
                                </h3>
                                <p className="text-xs md:text-sm text-gray-600 truncate mb-1 w-full">
                                  {user.headline || "Professional"}
                                </p>
                                
                                {/* Industry - if available */}
                                {user.industry && (
                                  <div className="mt-1 text-xs md:text-sm text-gray-600 truncate w-full">
                                    {user.industry}
                                  </div>
                                )}
                                
                                {/* Skills tags - if available */}
                                {user.skills && user.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2 w-full">
                                    {user.skills.slice(0, 2).map((skill, index) => (
                                      <span key={index} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded truncate" style={{ maxWidth: '120px' }}>
                                        {typeof skill === 'string' ? skill : skill.name}
                                      </span>
                                    ))}
                                    {user.skills.length > 2 && (
                                      <span className="text-xs text-gray-500">+{user.skills.length - 2} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons - Fixed positioning */}
                              <div className="mt-3 sm:mt-4 flex space-x-2 w-full">
                                <button
                                  onClick={() => handleConnect(user._id)}
                                  disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                                  className={`flex-1 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium ${
                                    user.connectionStatus === 'pending' 
                                      ? 'bg-gray-100 text-gray-500'
                                      : user.connectionStatus === 'connected'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    <UserPlus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                    {user.connectionStatus === 'pending' 
                                      ? 'Pending' 
                                      : user.connectionStatus === 'connected'
                                        ? 'Connected'
                                        : 'Connect'}
                                  </div>
                                </button>
                                
                                <button
                                  onClick={() => handleFollow(user._id)}
                                  className={`flex-1 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium ${
                                    user.isFollowing
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    <Rss className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                    {user.isFollowing ? 'Following' : 'Follow'}
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Empty state - unchanged
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-8 text-center">
                        <div className="inline-flex h-12 w-12 md:h-16 md:w-16 rounded-full bg-orange-100 items-center justify-center mb-3 md:mb-4">
                          <MapPin className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                        </div>
                        <h3 className="text-base md:text-xl font-semibold text-gray-800 mb-1 md:mb-2">No Nearby Professionals</h3>
                        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                          {userLocation 
                            ? "We couldn't find any professionals near your current location." 
                            : "Please enable location services to see professionals near you."}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <button 
                            onClick={getUserLocation}
                            className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Retry
                          </button>
                          <button 
                            onClick={() => navigate('/network/nearby')}
                            className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Explore More
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

           {activeSection === 'content' && (
              <div className="bg-white rounded-xl shadow-md p-3 md:p-6">
                <div className="mb-3 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Content Creation</h2>
                  <p className="text-xs md:text-sm text-gray-500">Share updates, insights, and connect with your network</p>
                </div>
                
                {/* CreatePost Component - Add responsive props or wrapper */}
                <div className="create-post-wrapper">
                  <CreatePost />
                </div>
                
                {/* Recent Posts Preview - More responsive */}
                {recentPosts.length > 0 && (
                  <div className="mt-4 md:mt-8">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base md:text-lg font-semibold text-gray-800">Your Recent Posts</h3>
                      <Link to="/posts" className="text-xs md:text-sm text-orange-500 hover:text-orange-600">
                        View All →
                      </Link>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      {recentPosts.slice(0, 2).map(post => (
                        <div key={post._id} className="p-2 md:p-4 border border-gray-100 rounded-lg hover:bg-orange-50 transition-colors">
                          <div className="flex items-start">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg overflow-hidden mr-2 md:mr-3 flex-shrink-0">
                              <img 
                                src={getProfilePicture(post.author || user)}
                                alt={`${post.author?.firstName || user?.firstName || 'User'}`}
                                className="h-full w-full object-cover" 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-medium text-xs md:text-sm text-gray-900 truncate">
                                  {post.author?.firstName || user?.firstName || 'You'} {post.author?.lastName || user?.lastName || ''}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(post.createdAt)}
                                </p>
                              </div>
                              <p className="text-xs md:text-sm text-gray-700 mt-1 line-clamp-2">
                                {post.content}
                              </p>
                              
                              {post.images && post.images.length > 0 && (
                                <div className="mt-2">
                                  <div className="h-20 md:h-28 rounded-lg overflow-hidden">
                                    <img 
                                      src={post.images[0].url} 
                                      alt="Post media"
                                      className="h-full w-full object-cover" 
                                    />
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    {post.likes || 0}
                                  </div>
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {post.comments?.length || 0}
                                  </div>
                                </div>
                                <Link to={`/posts/${post._id}`} className="text-xs md:text-sm text-orange-500 hover:text-orange-600 font-medium">
                                  View Post
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'portfolio' && (
              <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Your Portfolio</h2>
                  <p className="text-sm text-gray-500">Manage your projects, streaks, and achievements</p>
                </div>
                
                {/* Portfolio dashboard - stack on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Projects Section */}
                  <div className="space-y-4">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Projects</h3>
                    
                    {userProjects.length > 0 ? (
                      <div className="space-y-3 md:space-y-4">
                        {userProjects.map(project => (
                          <div key={project._id} className="p-3 md:p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow">
                            <h4 className="font-medium text-sm md:text-base text-gray-900">{project.title || 'Untitled Project'}</h4>
                            <p className="text-xs md:text-sm text-gray-600 mt-1">
                              {project.description?.length > 80
                                ? project.description.substring(0, 80) + '...' 
                                : project.description || 'No description available'}
                            </p>
                            <div className="mt-2 md:mt-3 flex justify-between items-center">
                              <Link 
                                to={`/portfolio/projects/${project._id}`}
                                className="text-orange-500 hover:text-orange-600 text-xs md:text-sm font-medium"
                              >
                                View Details
                              </Link>
                              <span className="text-xs text-gray-500">
                                {formatDate(project.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <Link to="/portfolio/projects" className="block text-center text-orange-500 font-medium pt-2 text-sm">
                          View All Projects →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4 md:py-6">
                        <p className="text-xs md:text-sm text-gray-500">No projects yet</p>
                        <Link 
                          to="/portfolio/projects/new" 
                          className="mt-2 inline-block text-orange-500 hover:text-orange-600 text-xs md:text-sm font-medium"
                        >
                          Create Your First Project →
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {/* Achievements Section */}
                  <div className="space-y-4">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">Achievements</h3>
                    
                    {userAchievements.length > 0 ? (
                      <div className="space-y-3 md:space-y-4">
                        {userAchievements.map(achievement => (
                          <div key={achievement._id} className="p-3 md:p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow">
                            <div className="flex">
                              <div className="mr-3 flex-shrink-0">
                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                  {achievement.image ? (
                                    <img 
                                      src={achievement.image} 
                                      alt={achievement.title || 'Achievement'}
                                      className="h-6 w-6 md:h-8 md:w-8 object-contain" 
                                    />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm md:text-base text-gray-900">{achievement.title || 'Untitled Achievement'}</h4>
                                <p className="text-xs text-gray-500">{formatDate(achievement.dateAchieved)}</p>
                                <p className="text-xs md:text-sm text-gray-600 mt-1">
                                  {achievement.description?.length > 80
                                    ? achievement.description.substring(0, 80) + '...' 
                                    : achievement.description || 'No description available'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link to="/portfolio/achievements" className="block text-center text-orange-500 font-medium pt-2 text-sm">
                          View All Achievements →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4 md:py-6">
                        <p className="text-xs md:text-sm text-gray-500">No achievements yet</p>
                        <Link 
                          to="/portfolio/achievements/new" 
                          className="mt-2 inline-block text-orange-500 hover:text-orange-600 text-xs md:text-sm font-medium"
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

          {/* Footer - Adjusted for mobile */}
          <footer className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 md:py-4 mt-6">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-xs md:text-sm">© 2023 Meetkats • Privacy Policy • Terms of Service</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
