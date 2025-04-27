import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Navbar';
import api from '../services/api';
import { 
  PlusCircle, Check, Calendar, X, User, AlertTriangle, MapPin,
  Users, ChevronRight, Search, Filter, UserPlus, Rss, 
  Home, ArrowUpDown, RefreshCw, Bell, BarChart2, Activity, 
  Zap, Clock, Star, TrendingUp
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import defaultProfilePic from '../assets/default-avatar.png';
import eventService from '../services/eventService';
import networkService from '../services/networkService';
import nearbyUsersService from '../services/nearbyUsersService';
import LocationPermissionIcon from '../components/LocationPermissionIcon';

const MergedDashboard = () => {
  // Auth and navigation
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const toastContext = useToast();
  const toast = toastContext?.toast;
  const [loadings, setLoadings] = useState(true);
  
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [pendingRequests, setPendingRequests] = useState(0);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState([
    "All", "Business", "Technology", "Social", "Education", "Health"
  ]);
  const [professionals, setProfessionals] = useState([]);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(10); // Default 10km radius
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [selectedUser, setSelectedUser] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [unit, setUnit] = useState('km');
  const [filters, setFilters] = useState({
    industry: null,
    skills: [],
    interests: [],
    connectionStatus: 'all',
    lastActive: null
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    enabled: false,
    radius: 1,
    unit: 'km'
  });
  const [refreshing, setRefreshing] = useState(false);
  
  // Location state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const locationControlRef = useRef(null);
  
  // Tasks state
  const [planner, setPlanner] = useState([]);
  const [newTask, setNewTask] = useState('');
  
  // Added a new state for the dashboard animation
  const [loaded, setLoaded] = useState(false);
  
  // User stats - relevant for all user types
  const [stats, setStats] = useState({
    activityCount: 23,
    streak: 7,
    notifications: 5,
    progress: 65
  });

  useEffect(() => {
    // Fade-in animation effect
    setTimeout(() => {
      setLoaded(true);
    }, 300);
    
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Check localStorage for planner/tasks data
  useEffect(() => {
    const savedPlanner = localStorage.getItem('userPlanner');
    if (savedPlanner) {
      try {
        setPlanner(JSON.parse(savedPlanner));
      } catch (error) {
        console.error('Error parsing planner from localStorage:', error);
        setPlanner([]);
      }
    }
  }, []);

  // Fetch connection requests
  useEffect(() => {
    const fetchConnectionRequests = async () => {
      if (!user) return;
      
      try {
        const requests = await networkService.getConnectionRequests();
        setPendingRequests(requests.length || 0);
        setConnectionRequests(requests || []);
      } catch (error) {
        console.error('Error fetching connection requests:', error);
        setPendingRequests(0);
        setConnectionRequests([]);
      }
    };
    
    fetchConnectionRequests();
  }, [user]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const apiFilters = { 
          filter: filter,
          limit: 3 // Only get a few events for the dashboard
        };
        
        if (categoryFilter && categoryFilter !== 'All') {
          apiFilters.category = categoryFilter.toLowerCase();
        }
        
        if (searchQuery) {
          apiFilters.search = searchQuery;
        }
        
        const response = await eventService.getEvents(apiFilters);
        
        if (response.categories && response.categories.length > 0) {
          const extractedCategories = ['All', ...response.categories.map(cat => 
            typeof cat === 'string' ? cat : (cat._id || 'Other')
          )];
          setCategories(extractedCategories);
        }
        
        const eventsData = response.events || response.data || [];
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchEvents();
  }, [filter, categoryFilter, searchQuery]);

  // Get user's location and fetch nearby users
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        };
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            setUserLocation({ 
              latitude, 
              longitude,
              timestamp: new Date().toISOString()
            });
            
            fetchNearbyUsers(latitude, longitude, 10);
            setLocationEnabled(true);
          },
          (error) => {
            console.error('Error getting location:', error);
            let errorMessage = "Location access denied. Please enable location services.";
            
            setLocationError(errorMessage);
            setLocationEnabled(false);
          },
          options
        );
      } else {
        setLocationError("Geolocation is not supported by your browser.");
        setLocationEnabled(false);
      }
    };

    if (user) {
      getUserLocation();
    }
  }, [user]);

  // Fetch nearby users function
  const fetchNearbyUsers = async (latitude, longitude, distance) => {
    try {
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        throw new Error("Invalid coordinates provided");
      }
      
      const nearbyResponse = await nearbyUsersService.getNearbyUsers({
        latitude,
        longitude,
        distance
      });
      
      // Extract the users array from the response
      const nearbyUsersArray = nearbyResponse.users || nearbyResponse || [];
      
      if (!Array.isArray(nearbyUsersArray)) {
        throw new Error("Invalid response format from server");
      }
      
      // Get connections to exclude them from results
      let connections = [];
      try {
        connections = await networkService.getConnections('all');
      } catch (connectionError) {
        console.error('Error fetching connections:', connectionError);
        connections = [];
      }
      
      // Create a Set of connection IDs for faster lookup
      const connectionIds = new Set(
        Array.isArray(connections) ? connections.map(conn => conn._id || conn.id) : []
      );
      
      // Filter out users who are already connections
      const filteredUsers = nearbyUsersArray.filter(user => 
        user._id && !connectionIds.has(user._id) && !connectionIds.has(user.id)
      );
      
      // Enhance user objects with more info
      const enhancedUsers = filteredUsers.map(user => ({
        ...user,
        distanceFormatted: formatDistance(user.distance)
      }));
      
      // Keep only the closest 3 users
      setNearbyUsers(enhancedUsers.slice(0, 3));
    } catch (error) {
      console.error('Error fetching nearby professionals:', error);
      setLocationError(error.message || "Failed to fetch nearby professionals");
      setNearbyUsers([]);
    }
  };

  // Task management functions
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
    
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
      if (toast) {
        toast({
          title: "Failed to save task",
          description: "Your task was added but may not persist after refresh",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    }
    
    setNewTask('');
  };

  const toggleTaskCompletion = (taskId) => {
    const updatedPlanner = planner.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setPlanner(updatedPlanner);
    
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
    }
  };

  const deleteTask = (taskId) => {
    const updatedPlanner = planner.filter(task => task.id !== taskId);
    setPlanner(updatedPlanner);
    
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
    }
  };

  // Connection management functions
  const handleAcceptConnection = async (userId) => {
    try {
      await networkService.acceptConnection(userId);
      setPendingRequests(prev => prev - 1);
      setConnectionRequests(prev => prev.filter(req => req._id !== userId));
      
      if (toast) {
        toast({
          title: "Connection Accepted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
      
      if (toast) {
        toast({
          title: "Failed to accept connection",
          description: error.message || "Please try again later",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleDeclineConnection = async (userId) => {
    try {
      await networkService.declineConnection(userId);
      setPendingRequests(prev => prev - 1);
      setConnectionRequests(prev => prev.filter(req => req._id !== userId));
      
      if (toast) {
        toast({
          title: "Connection Request Declined",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error declining connection request:', error);
      
      if (toast) {
        toast({
          title: "Failed to decline connection",
          description: error.message || "Please try again later",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Handle connecting with a nearby user
  const handleConnect = async (userId) => {
    try {
      await networkService.requestConnection(userId);
      setNearbyUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, connectionStatus: 'pending' } 
            : user
        )
      );
      
      if (toast) {
        toast({
          title: "Connection Request Sent",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      
      if (toast) {
        toast({
          title: "Failed to send request",
          description: error.message || "Please try again later",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return 'Unknown distance';
    
    if (distance < 0.1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    
    if (distance < 10) {
      return `${distance.toFixed(1)}km away`;
    }
    
    return `${Math.round(distance)}km away`;
  };

  const getProfilePicture = (userObj) => {
    if (userObj?.profilePicture) {
      return userObj.profilePicture;
    }
    return defaultProfilePic;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // The useEffect will trigger a new API call with the searchQuery
  };

  // Calculate progress for tasks
  const completedTasksPercentage = planner.length > 0 
    ? Math.round((planner.filter(task => task.completed).length / planner.length) * 100) 
    : 0;

  // Loading state for main dashboard
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-orange-50 via-white to-orange-50">
        <div className="animate-pulse h-16 w-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 opacity-75"></div>
          <div className="absolute inset-0 rounded-full border-4 border-orange-300 opacity-75 animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col md:flex-row h-screen bg-gradient-to-r from-orange-50 via-white to-orange-50 ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
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
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => setActiveSection('events')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'events' ? 'text-orange-500' : 'text-gray-500'}`}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Events</span>
          </button>
          <button 
            onClick={() => setActiveSection('network')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'network' ? 'text-orange-500' : 'text-gray-500'}`}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs">Network</span>
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
            {/* Dashboard Header */}
            <div className="bg-white rounded-xl shadow-md mb-6 p-6 md:p-8 border-l-4 border-orange-500 relative overflow-hidden transform hover:shadow-lg transition-all duration-300">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 rounded-full -ml-32 -mb-32"></div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 mr-4 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {new Date().getDate()}
                    </div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Welcome back, <span className="text-orange-500">{user?.firstName || 'User'}!</span></h1>
                      <p className="text-sm md:text-base text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 w-full md:w-auto">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/connections`}>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-sm">
                        <Users className="h-4 w-4 mr-1" />
                        {pendingRequests} requests
                      </span>
                    </Link>
                    <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-sm">
                      <Check className="h-4 w-4 mr-1" />
                      {planner.filter(task => !task.completed).length} tasks
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-sm">
                      <Bell className="h-4 w-4 mr-1" />
                      {stats.notifications} notifications
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-4 pt-3 border-t border-gray-100">
                <div className="bg-orange-50 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                  <div>
                    <p className="text-xs text-gray-600">Activities</p>
                    <p className="text-lg md:text-xl font-bold text-gray-800">{stats.activityCount}</p>
                  </div>
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Activity className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                  <div>
                    <p className="text-xs text-gray-600">Daily Streak</p>
                    <p className="text-lg md:text-xl font-bold text-gray-800">{stats.streak} days</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Zap className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                  <div>
                    <p className="text-xs text-gray-600">Progress</p>
                    <p className="text-lg md:text-xl font-bold text-gray-800">{stats.progress}%</p>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <BarChart2 className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                  <div>
                    <p className="text-xs text-gray-600">Completed</p>
                    <p className="text-lg md:text-xl font-bold text-gray-800">{planner.filter(task => task.completed).length}</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs Navigation - Scrollable on mobile */}
            <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden border-b border-orange-100 relative">
              <div className="bg-gradient-to-r from-orange-600 to-orange-500 h-1 absolute top-0 left-0 right-0"></div>
              <div className="flex overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 flex items-center ${
                    activeSection === 'overview'
                      ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection('events')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 flex items-center ${
                    activeSection === 'events'
                      ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </button>
                <button
                  onClick={() => setActiveSection('network')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 flex items-center ${
                    activeSection === 'network'
                      ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Network
                </button>
              </div>
            </div>

            {/* Dashboard Content - Based on active section */}
            {activeSection === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Task Planner */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden h-full border border-orange-100 transform hover:shadow-lg transition-all duration-300">
                    <div className="border-b border-orange-100 px-4 md:px-6 py-4 flex justify-between items-center bg-orange-50">
                      <h3 className="font-semibold text-gray-800 flex items-center">
                        <Check className="h-5 w-5 mr-2 text-orange-500" />
                        My Tasks
                      </h3>
                      <div className="text-orange-500 hover:text-orange-600 cursor-pointer">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="px-4 md:px-6 pt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{completedTasksPercentage}% Complete</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-orange-500 h-2.5 rounded-full"
                          style={{ width: `${completedTasksPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="p-4 md:p-6">
                      {/* Add new task */}
                      <div className="flex mb-6">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          placeholder="Add a new task..."
                          className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-800"
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
                      <div className="space-y-3 max-h-60 md:max-h-72 overflow-y-auto">
                        {planner.length === 0 ? (
                          <div className="text-center py-6 md:py-8 bg-orange-50 rounded-lg border border-orange-100">
                            <Check className="h-10 w-10 mx-auto text-orange-400 mb-2" />
                            <p className="text-gray-600 text-sm">No tasks set yet. Add your first task above.</p>
                          </div>
                        ) : (
                          planner.map(task => (
                            <div 
                              key={task.id} 
                              className={`flex items-center justify-between p-3 md:p-4 border rounded-lg shadow-sm ${
                                task.completed ? 'bg-green-50 border-green-100' : 'bg-white border-orange-100'
                              } transform hover:scale-[1.02] transition-all duration-200`}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <button
                                  onClick={() => toggleTaskCompletion(task.id)}
                                  className={`flex-shrink-0 h-5 w-5 md:h-6 md:w-6 rounded-full border ${
                                    task.completed ? 'bg-green-500 border-green-500' : 'border-orange-500'
                                  } mr-3 md:mr-4 flex items-center justify-center shadow-sm`}
                                >
                                  {task.completed && <Check className="h-3 w-3 md:h-4 md:w-4 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm md:text-base truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
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
                                <X className="h-4 w-4 md:h-5 md:w-5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Center and Right Columns - Activity Summary and Nearby Users */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Activity Summary */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100 transform hover:shadow-lg transition-all duration-300">
                      <div className="border-b border-orange-100 px-4 md:px-6 py-4 flex justify-between items-center bg-orange-50">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                          <Activity className="h-5 w-5 mr-2 text-orange-500" />
                          Recent Activity
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button className="text-white bg-orange-500 hover:bg-orange-600 rounded-full px-3 py-1.5 text-xs flex items-center shadow-sm">
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Add Activity
                          </button>
                          <Link to="/activities" className="text-orange-500 hover:text-orange-600 text-xs md:text-sm flex items-center">
                            View All <ChevronRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4 shadow-md flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-sm text-orange-100">Project Update</h4>
                                <p className="text-lg font-bold">Completed</p>
                              </div>
                              <div className="bg-white/20 p-2 rounded-full">
                                <Check className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="mt-4 text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-orange-200" />
                              <span>Today, 9:30 AM</span>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-sm text-blue-100">Meeting</h4>
                                <p className="text-lg font-bold">Scheduled</p>
                              </div>
                              <div className="bg-white/20 p-2 rounded-full">
                                <Calendar className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="mt-4 text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-blue-200" />
                              <span>Tomorrow, 2:00 PM</span>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-md flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-sm text-green-100">Milestone</h4>
                                <p className="text-lg font-bold">Achieved</p>
                              </div>
                              <div className="bg-white/20 p-2 rounded-full">
                                <Star className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="mt-4 text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-green-200" />
                              <span>Yesterday, 4:15 PM</span>
                            </div>
                          </div>
                        </div>
                      
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-800">Weekly Progress</h4>
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">{stats.progress}% to goal</span>
                          </div>
                          <div className="w-full bg-white rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-orange-400 to-orange-500 h-2.5 rounded-full"
                              style={{ width: `${stats.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <button className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-600 shadow-md transition-colors">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add New Activity
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Upcoming Events Preview */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100 transform hover:shadow-lg transition-all duration-300">
                      <div className="border-b border-orange-100 px-4 md:px-6 py-4 flex justify-between items-center bg-orange-50">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                          Upcoming Events
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Link to="/events/create" className="text-white bg-orange-500 hover:bg-orange-600 rounded-full px-3 py-1.5 text-xs flex items-center shadow-sm">
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Host Event
                          </Link>
                          <Link to="/events" className="text-orange-500 hover:text-orange-600 text-xs md:text-sm flex items-center">
                            View All <ChevronRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        {events.length > 0 ? (
                          <div className="space-y-4">
                            {events.slice(0, 2).map(event => (
                              <div key={event._id || event.id} className="flex border border-orange-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                <div className="w-24 md:w-32 bg-orange-100 flex-shrink-0 relative">
                                  <img 
                                    src={event.coverImage?.url || "/api/placeholder/400/200"} 
                                    alt={event.name || "Event"}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/40 to-transparent"></div>
                                </div>
                                <div className="p-3 md:p-4 flex-1">
                                  <h4 className="font-semibold text-sm md:text-base text-gray-800 mb-1">{event.name || "Untitled Event"}</h4>
                                  <div className="flex items-center text-gray-600 mb-1">
                                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                    <span className="text-xs md:text-sm">{formatDate(event.startDateTime)}</span>
                                  </div>
                                  <div className="flex items-center text-gray-600 mb-2">
                                    <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                    <span className="text-xs md:text-sm">{event.virtual ? "Virtual Event" : (event.location?.name || "Location TBA")}</span>
                                  </div>
                                  <Link to={`/events/${event._id || event.id}`} className="text-orange-500 hover:text-orange-600 text-xs md:text-sm font-medium flex items-center">
                                    View Details <ChevronRight className="h-3 w-3 ml-1" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Calendar className="h-12 w-12 mx-auto text-orange-400 mb-3" />
                            <p className="text-gray-600 text-sm mb-3">No upcoming events found.</p>
                            <Link to="/events" className="text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-full text-sm font-medium inline-block shadow-md">
                              Browse All Events →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Nearby Professionals */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100 transform hover:shadow-lg transition-all duration-300">
                      <div className="border-b border-orange-100 px-4 md:px-6 py-4 flex justify-between items-center bg-orange-50">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                          <h3 className="font-semibold text-gray-800">Nearby Professionals</h3>
                        </div>
                        <Link to="/network/nearby" className="text-orange-500 hover:text-orange-600 text-xs md:text-sm flex items-center">
                          View All <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                      <div className="p-4 md:p-6">
                        {locationError ? (
                          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-100">
                            <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-3" />
                            <p className="text-sm text-gray-700 mb-3">{locationError}</p>
                            <LocationPermissionIcon />
                          </div>
                        ) : nearbyUsers.length > 0 ? (
                          <div className="space-y-4">
                            {nearbyUsers.map(user => (
                              <div key={user._id} className="flex items-start border border-orange-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 bg-white transform hover:scale-[1.02]">
                                <div className="mr-3 flex-shrink-0">
                                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 border-orange-200 shadow-md">
                                    <img 
                                      src={getProfilePicture(user)} 
                                      alt={`${user.firstName} ${user.lastName}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between">
                                    <h4 className="text-sm md:text-lg font-medium text-gray-800 truncate">
                                      {user.firstName} {user.lastName}
                                    </h4>
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {user.distanceFormatted}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600">{user.headline || 'Professional'}</p>
                                  
                                  {/* Industry tags */}
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{user.industry || 'Technology'}</span>
                                  </div>
                                  
                                  <div className="mt-3 flex space-x-2">
                                    <button
                                      onClick={() => handleConnect(user._id)}
                                      disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                                      className={`flex items-center px-3 py-1.5 rounded-full text-xs ${
                                        user.connectionStatus === 'pending'
                                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                          : user.connectionStatus === 'connected'
                                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                      } shadow-sm transition-colors`}
                                    >
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      {user.connectionStatus === 'pending'
                                        ? 'Pending'
                                        : user.connectionStatus === 'connected'
                                          ? 'Connected'
                                          : 'Connect'}
                                    </button>
                                    
                                    <Link
                                      to={`/profile/${user._id}`}
                                      className="flex items-center px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm transition-colors"
                                    >
                                      View Profile
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-orange-50 bg-opacity-30 rounded-lg border border-orange-100">
                            <MapPin className="h-12 w-12 mx-auto text-orange-400 mb-3" />
                            <p className="text-gray-600 text-sm mb-3">No nearby professionals found.</p>
                            <button 
                              onClick={() => fetchNearbyUsers(userLocation?.latitude, userLocation?.longitude, 10)}
                              className="mt-2 inline-flex items-center justify-center px-4 py-2 text-sm bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-md"
                            >
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Refresh Location
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'events' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
                <div className="p-4 md:p-6">
                  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 flex items-center">
                        <Calendar className="h-6 w-6 mr-2 text-orange-500" />
                        Upcoming Events
                      </h2>
                      <p className="text-sm text-gray-600">Find events and professional gatherings in your area</p>
                    </div>
                    <Link to="/events/create" className="mt-3 md:mt-0">
                      <button className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full px-4 py-2 flex items-center justify-center transition-colors shadow-md">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Host an Event
                      </button>
                    </Link>
                  </div>
                  
                  <div className="mb-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search events..."
                          className="pl-10 w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-800"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="ml-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-full hover:bg-orange-600 transition shadow-md"
                      >
                        Search
                      </button>
                    </form>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button 
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'upcoming' ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                        onClick={() => setFilter('upcoming')}
                      >
                        Upcoming
                      </button>
                      <button 
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                        onClick={() => setFilter('all')}
                      >
                        All Events
                      </button>
                      <button 
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'past' ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                        onClick={() => setFilter('past')}
                      >
                        Past
                      </button>
                      
                      <div className="relative ml-auto">
                        <select
                          className="appearance-none bg-white text-gray-800 border border-gray-300 rounded-full pl-4 pr-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                          <option value="">Category</option>
                          {categories.map((category, index) => (
                            <option key={`category-${index}`} value={category}>{category}</option>
                          ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Featured Event */}
                  <div className="mb-6 relative rounded-xl overflow-hidden shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-orange-500/80"></div>
                    <div className="relative z-10 p-6 md:p-8 text-white">
                      <div className="flex flex-col md:flex-row md:items-center">
                        <div className="md:w-2/3">
                          <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-md">Featured</span>
                          <h3 className="text-2xl md:text-3xl font-bold mb-2">Annual Conference 2023</h3>
                          <p className="mb-4 text-orange-100">Join the biggest professional gathering of the season with experts from around the world.</p>
                          
                          <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-orange-200" />
                              <span className="text-sm">May 15, 2023</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-orange-200" />
                              <span className="text-sm">Convention Center, New York</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-orange-200" />
                              <span className="text-sm">1,240 participants</span>
                            </div>
                          </div>
                          
                          <div className="space-x-3">
                            <Link to="/events/conference-2023" className="inline-block bg-white text-orange-600 font-medium px-4 py-2 rounded-full text-sm shadow-md hover:bg-orange-50 transition-colors">
                              View Details
                            </Link>
                            <button className="inline-block bg-orange-600 text-white font-medium px-4 py-2 rounded-full text-sm shadow-md hover:bg-orange-700 transition-colors border border-orange-500">
                              Register Now
                            </button>
                          </div>
                        </div>
                        <div className="hidden md:block md:w-1/3">
                          <div className="relative h-40 w-40 mx-auto">
                            <div className="absolute inset-0 rounded-full bg-orange-600 opacity-25 animate-ping"></div>
                            <div className="relative bg-white rounded-full p-4 shadow-lg">
                              <div className="text-center">
                                <span className="block text-orange-600 text-3xl font-bold">15</span>
                                <span className="block text-orange-600 text-sm font-medium">DAYS</span>
                                <span className="block text-gray-600 text-xs mt-1">UNTIL EVENT</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url(/api/placeholder/1200/400)' }}></div>
                  </div>
                  
                  {/* Events Grid */}
                  {loadingData ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 border-t-4 border-orange-500 border-solid rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading events...</p>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-10 bg-orange-50 rounded-lg border border-orange-100">
                      <Calendar className="h-16 w-16 mx-auto text-orange-400 mb-3" />
                      <p className="text-gray-600 mb-4">No events found matching your criteria.</p>
                      {(searchQuery || categoryFilter !== 'All') && (
                        <button 
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-full text-white shadow-md"
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('All');
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.map((event) => (
                        <div key={event._id || event.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-orange-100 transform hover:scale-[1.02]">
                          <div className="relative">
                            <img 
                              src={event.coverImage?.url || "/api/placeholder/400/200"} 
                              alt={event.name || "Event"}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            {event.category && (
                              <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                {typeof event.category === 'string' ? event.category : 'Other'}
                              </span>
                            )}
                          </div>
                          
                          <div className="p-5">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{event.name || "Untitled Event"}</h3>
                            
                            <div className="flex items-center text-gray-600 mb-2">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span className="text-sm">{formatDate(event.startDateTime)}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600 mb-4">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                {event.virtual 
                                  ? "Virtual Event" 
                                  : (event.location?.name || "Location TBA")}
                              </span>
                            </div>
                            
                            <div className="flex justify-end">
                              <Link to={`/events/${event._id || event.id}`}>
                                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-md flex items-center">
                                  View Details
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6 text-center">
                    <Link to="/events" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-full shadow-md transition-colors">
                      View All Events →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'network' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
                <div className="p-4 md:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 flex items-center">
                      <Users className="h-6 w-6 mr-2 text-orange-500" />
                      Your Professional Network
                    </h2>
                    <p className="text-sm text-gray-600">Connect with professionals in your field</p>
                  </div>
                  
                 {/* Stats Overview */}
                 <div className="mb-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-4 text-white">
                      <h3 className="text-lg font-bold flex items-center mb-3">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Network Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                          <div className="flex items-center">
                            <div className="bg-white/20 p-2 rounded-full mr-3">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xl font-bold">245</p>
                              <p className="text-xs text-white/70">Total Connections</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                          <div className="flex items-center">
                            <div className="bg-white/20 p-2 rounded-full mr-3">
                              <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xl font-bold">18</p>
                              <p className="text-xs text-white/70">New This Month</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                          <div className="flex items-center">
                            <div className="bg-white/20 p-2 rounded-full mr-3">
                              <Activity className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xl font-bold">78%</p>
                              <p className="text-xs text-white/70">Active Connections</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Connection requests and nearby professionals */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-orange-50 rounded-xl p-4 md:p-6 border border-orange-100 shadow-md">
                      <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-orange-500" />
                        Connection Requests
                      </h3>
                      {pendingRequests > 0 ? (
                        <div className="space-y-3 md:space-y-4">
                          {connectionRequests.slice(0, 3).map(request => (
                            <div key={request._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg shadow-sm border border-orange-100 transform hover:scale-[1.02] transition-all duration-200">
                              <div className="flex items-center mb-3 sm:mb-0">
                                <div className="h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden border-2 border-orange-200 shadow-md mr-3">
                                  <img 
                                    src={getProfilePicture(request)} 
                                    alt={`${request?.firstName || 'User'} ${request?.lastName || ''}`} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm md:text-base text-gray-800">{request?.firstName || 'User'} {request?.lastName || ''}</h4>
                                  <p className="text-xs md:text-sm text-gray-600">{request?.headline || 'Professional'}</p>
                                  
                                  {/* Industry tags */}
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{request?.industry || 'Technology'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleAcceptConnection(request._id)}
                                  className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs md:text-sm hover:bg-orange-600 shadow-md transition-colors"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleDeclineConnection(request._id)}
                                  className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs md:text-sm hover:bg-gray-300 shadow-md transition-colors"
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          ))}
                          {connectionRequests.length > 3 && (
                            <Link to="/network" className="block w-full text-center bg-orange-100 text-orange-700 py-2 rounded-full mt-4 text-sm hover:bg-orange-200 transition-colors shadow-md">
                              View All Requests ({connectionRequests.length}) →
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white rounded-lg border border-orange-100">
                          <UserPlus className="h-12 w-12 mx-auto text-orange-400 mb-3" />
                          <p className="text-gray-600 mb-3">No pending connection requests</p>
                          <Link to="/network/discover" className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-600 shadow-md transition-colors">
                            Find Connections →
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {/* Nearby Professionals Card */}
                    <div className="bg-orange-50 rounded-xl p-4 md:p-6 border border-orange-100 shadow-md">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                          <h3 className="text-base md:text-lg font-semibold text-gray-800">Nearby Professionals</h3>
                        </div>
                        <Link to="/network/nearby" className="text-xs md:text-sm text-orange-600 hover:text-orange-700 flex items-center">
                          See All <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                      
                      {/* User Cards */}
                      {locationError ? (
                        <div className="bg-white rounded-xl p-6 text-center border border-orange-100">
                          <div className="flex flex-col items-center justify-center">
                            <AlertTriangle className="h-12 w-12 text-orange-500 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Location Error</h3>
                            <p className="text-sm text-gray-600 mb-4">{locationError}</p>
                            <button
                              onClick={() => fetchNearbyUsers(userLocation?.latitude, userLocation?.longitude, 10)}
                              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-600 transition-colors shadow-md"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Try Again
                            </button>
                          </div>
                        </div>
                      ) : nearbyUsers.length > 0 ? (
                        <div className="space-y-4">
                          {nearbyUsers.map(user => (
                            <div key={user._id} className="flex items-start p-4 md:p-5 border border-orange-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 bg-white transform hover:scale-[1.02]">
                              {/* User image */}
                              <div className="mr-4">
                                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 border-orange-200 shadow-md">
                                  <img 
                                    src={getProfilePicture(user)} 
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </div>
                              
                              {/* User details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <h3 className="text-base md:text-lg font-medium text-gray-800 truncate">
                                      {user.firstName} {user.lastName}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-600 truncate">{user.headline || 'Professional'}</p>
                                  </div>
                                  
                                  {user.distance !== undefined && (
                                    <span className="mt-1 md:mt-0 text-xs text-gray-500 flex items-center md:ml-2">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {user.distanceFormatted || formatDistance(user.distance)}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Industry and skills */}
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{user.industry || 'Technology'}</span>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="mt-3 flex space-x-2">
                                  <button
                                    onClick={() => handleConnect(user._id)}
                                    disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                                    className={`flex items-center px-3 py-1.5 rounded-full text-xs ${
                                      user.connectionStatus === 'pending'
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : user.connectionStatus === 'connected'
                                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                          : 'bg-orange-500 text-white hover:bg-orange-600'
                                    } shadow-md transition-colors`}
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    {user.connectionStatus === 'pending'
                                      ? 'Pending'
                                      : user.connectionStatus === 'connected'
                                        ? 'Connected'
                                        : 'Connect'}
                                  </button>
                                  
                                  <Link
                                    to={`/profile/${user._id}`}
                                    className="flex items-center px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md transition-colors"
                                  >
                                    View Profile
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <Link to="/network/nearby" className="block w-full text-center bg-orange-100 text-orange-700 py-2 rounded-full mt-2 text-sm hover:bg-orange-200 transition-colors shadow-md">
                            Find More Professionals →
                          </Link>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-6 text-center border border-orange-100">
                          <div className="inline-flex h-16 w-16 rounded-full bg-orange-100 items-center justify-center mb-4">
                            <MapPin className="h-8 w-8 text-orange-500" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Nearby Professionals</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {userLocation 
                              ? "We couldn't find any professionals near your current location." 
                              : "Please enable location services to see professionals near you."}
                          </p>
                          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <button 
                              onClick={() => fetchNearbyUsers(userLocation?.latitude, userLocation?.longitude, 10)}
                              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-md"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Location
                            </button>
                            <Link
                              to="/network/nearby"
                              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 shadow-md"
                            >
                              Explore Network
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Featured Professionals Section */}
                  <div className="mt-6 bg-white rounded-xl overflow-hidden border border-orange-100 shadow-md">
                    <div className="border-b border-orange-100 px-4 md:px-6 py-4 flex justify-between items-center bg-orange-50">
                      <h3 className="font-semibold text-gray-800 flex items-center">
                        <Star className="h-5 w-5 mr-2 text-orange-500" />
                        Featured Professionals
                      </h3>
                      <Link to="/professionals" className="text-orange-500 hover:text-orange-600 text-xs md:text-sm flex items-center">
                        View All <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                    <div className="p-4 md:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((index) => (
                          <div key={index} className="bg-orange-50 rounded-lg overflow-hidden border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="p-4 text-center">
                              <div className="h-16 w-16 rounded-full border-2 border-orange-200 mx-auto mb-3 overflow-hidden">
                                <img 
                                  src="/api/placeholder/100/100" 
                                  alt={`Featured Professional ${index}`} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <h4 className="font-semibold text-gray-800 mb-1">Jennifer Williams</h4>
                              <p className="text-xs text-gray-600 mb-2">Senior Project Manager</p>
                              <div className="flex justify-center gap-1 mb-3">
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Technology</span>
                              </div>
                              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-full py-1.5 shadow-sm">
                                View Profile
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white shadow-md py-4 md:py-5 mt-6 border-t border-orange-100">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-xs md:text-sm text-gray-600">© 2023 MeetKats • Privacy Policy • Terms of Service</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MergedDashboard;
