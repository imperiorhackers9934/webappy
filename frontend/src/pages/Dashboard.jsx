import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Navbar';
import api from '../services/api';
import { 
  PlusCircle, Check, Calendar, X, User, AlertTriangle, MapPin,
  Users, ChevronRight, Search, Filter, UserPlus, Rss, 
  Home, ArrowUpDown, RefreshCw, Award, Target, Activity, Zap
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
    "All", "Business", "Technology", "Social", "Education", "Health", "Sports"
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

  useEffect(() => {
    // Fake loading effect for UI
    setTimeout(() => {
      setLoaded(true);
    }, 500);
    
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
      <div className="flex justify-center items-center min-h-screen bg-blue-900">
        <div className="animate-ping rounded-full h-16 w-16 border-4 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Sidebar - hidden on mobile, visible on md and up */}
      <div className="hidden md:block">
        <Sidebar user={user} onLogout={logout} />
      </div>
      
      {/* Mobile Navbar - visible only on small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-900 shadow-lg z-10">
        <div className="flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => setActiveSection('overview')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'overview' ? 'text-blue-300' : 'text-gray-300'}`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => setActiveSection('events')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'events' ? 'text-blue-300' : 'text-gray-300'}`}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Events</span>
          </button>
          <button 
            onClick={() => setActiveSection('network')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'network' ? 'text-blue-300' : 'text-gray-300'}`}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs">Network</span>
          </button>
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center p-2 text-gray-300"
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
            <div className="bg-gradient-to-r from-blue-800 to-indigo-800 rounded-xl shadow-lg mb-6 p-4 md:p-6 border-l-4 border-blue-400 transform hover:scale-[1.01] transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 mr-4 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {new Date().getDate()}
                    </div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Hey, <span className="text-blue-300">{user?.firstName || 'Athlete'}!</span></h1>
                      <p className="text-sm md:text-base text-blue-200">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 w-full md:w-auto">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/connections`}>
                      <span className="bg-blue-700 text-blue-100 px-3 py-1 rounded-md text-sm font-medium flex items-center shadow-sm">
                        <Users className="h-4 w-4 mr-1" />
                        {pendingRequests} requests
                      </span>
                    </Link>
                    <span className="bg-indigo-700 text-indigo-100 px-3 py-1 rounded-md text-sm font-medium flex items-center shadow-sm">
                      <Target className="h-4 w-4 mr-1" />
                      {planner.filter(task => !task.completed).length} goals
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs Navigation - Scrollable on mobile */}
            <div className="mb-6 bg-blue-800 rounded-xl shadow-lg overflow-hidden border-b border-blue-700">
              <div className="flex overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 flex items-center ${
                    activeSection === 'overview'
                      ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-900 bg-opacity-50'
                      : 'text-gray-300 hover:text-blue-300'
                  }`}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection('events')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 flex items-center ${
                    activeSection === 'events'
                      ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-900 bg-opacity-50'
                      : 'text-gray-300 hover:text-blue-300'
                  }`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </button>
                <button
                  onClick={() => setActiveSection('network')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 flex items-center ${
                    activeSection === 'network'
                      ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-900 bg-opacity-50'
                      : 'text-gray-300 hover:text-blue-300'
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
                  <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl shadow-lg overflow-hidden h-full border border-blue-700 transform hover:translate-y-[-4px] transition-all duration-300">
                    <div className="border-b border-blue-700 px-4 md:px-6 py-4 flex justify-between items-center bg-blue-900 bg-opacity-40">
                      <h3 className="font-semibold text-blue-100 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-400" />
                        My Goals
                      </h3>
                      <div className="text-blue-300 hover:text-blue-200 cursor-pointer">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="px-4 md:px-6 pt-4">
                      <div className="flex justify-between text-xs text-blue-200 mb-1">
                        <span>Progress</span>
                        <span>{completedTasksPercentage}% Complete</span>
                      </div>
                      <div className="w-full bg-blue-900 rounded-full h-2 mb-4">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full"
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
                          placeholder="Add a new goal..."
                          className="flex-1 border border-blue-600 rounded-l-md py-2 px-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-900 text-white"
                          onKeyPress={(e) => e.key === 'Enter' && addTask()}
                        />
                        <button
                          onClick={addTask}
                          className="bg-blue-600 text-white rounded-r-md px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-blue-500 transition"
                        >
                          <PlusCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      </div>

                      {/* Task list */}
                      <div className="space-y-3 max-h-60 md:max-h-72 overflow-y-auto">
                        {planner.length === 0 ? (
                          <div className="text-center py-6 md:py-8 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                            <Target className="h-10 w-10 mx-auto text-blue-400 mb-2" />
                            <p className="text-blue-200 text-sm">No goals set yet. Add your first goal above.</p>
                          </div>
                        ) : (
                          planner.map(task => (
                            <div 
                              key={task.id} 
                              className={`flex items-center justify-between p-3 md:p-4 border rounded-lg shadow-md ${
                                task.completed ? 'bg-blue-700 border-blue-600' : 'bg-blue-900 border-blue-700'
                              } transform hover:scale-[1.02] transition-all duration-200`}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <button
                                  onClick={() => toggleTaskCompletion(task.id)}
                                  className={`flex-shrink-0 h-5 w-5 md:h-6 md:w-6 rounded-full border ${
                                    task.completed ? 'bg-green-500 border-green-500' : 'border-blue-500'
                                  } mr-3 md:mr-4 flex items-center justify-center shadow-sm`}
                                >
                                  {task.completed && <Check className="h-3 w-3 md:h-4 md:w-4 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm md:text-base truncate ${task.completed ? 'line-through text-blue-300' : 'text-blue-100'}`}>
                                    {task.text}
                                  </p>
                                  <p className="text-xs text-blue-400 truncate">
                                    Added {formatDate(task.date)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="ml-2 text-blue-400 hover:text-red-400 flex-shrink-0"
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
                
                {/* Center and Right Columns - Events Preview and Nearby Users */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Upcoming Events Preview */}
                    <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl shadow-lg overflow-hidden border border-blue-700 transform hover:translate-y-[-4px] transition-all duration-300">
                      <div className="border-b border-blue-700 px-4 md:px-6 py-4 flex justify-between items-center bg-blue-900 bg-opacity-40">
                        <h3 className="font-semibold text-blue-100 flex items-center">
                          <Activity className="h-5 w-5 mr-2 text-blue-400" />
                          Upcoming Events
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Link to="/events/create" className="text-white bg-blue-600 hover:bg-blue-500 rounded-md px-3 py-1.5 text-xs flex items-center shadow-sm">
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Host Event
                          </Link>
                          <Link to="/events" className="text-blue-300 hover:text-blue-200 text-xs md:text-sm flex items-center">
                            View All <ChevronRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        {events.length > 0 ? (
                          <div className="space-y-4">
                            {events.slice(0, 2).map(event => (
                              <div key={event._id || event.id} className="flex border border-blue-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-900 to-indigo-900">
                                <div className="w-24 md:w-32 bg-blue-700 flex-shrink-0">
                                  <div className="relative w-full h-full">
                                    <img 
                                      src={event.coverImage?.url || "/api/placeholder/400/200"} 
                                      alt={event.name || "Event"}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent opacity-60"></div>
                                  </div>
                                </div>
                                <div className="p-3 md:p-4 flex-1">
                                  <h4 className="font-semibold text-sm md:text-base text-blue-100 mb-1">{event.name || "Untitled Event"}</h4>
                                  <div className="flex items-center text-blue-300 mb-1">
                                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                    <span className="text-xs md:text-sm">{formatDate(event.startDateTime)}</span>
                                  </div>
                                  <div className="flex items-center text-blue-300 mb-2">
                                    <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                    <span className="text-xs md:text-sm">{event.virtual ? "Virtual Event" : (event.location?.name || "Location TBA")}</span>
                                  </div>
                                  <Link to={`/events/${event._id || event.id}`} className="text-blue-300 hover:text-blue-200 text-xs md:text-sm font-medium flex items-center">
                                    View Details <ChevronRight className="h-3 w-3 ml-1" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Activity className="h-12 w-12 mx-auto text-blue-400 mb-3" />
                            <p className="text-blue-200 text-sm mb-3">No upcoming events found.</p>
                            <Link to="/events" className="text-blue-300 bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-full text-sm font-medium inline-block shadow-md">
                              Browse All Events →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Nearby Professionals */}
                    <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl shadow-lg overflow-hidden border border-blue-700 transform hover:translate-y-[-4px] transition-all duration-300">
                      <div className="border-b border-blue-700 px-4 md:px-6 py-4 flex justify-between items-center bg-blue-900 bg-opacity-40">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                          <h3 className="font-semibold text-blue-100">Nearby Athletes</h3>
                        </div>
                        <Link to="/network/nearby" className="text-blue-300 hover:text-blue-200 text-xs md:text-sm flex items-center">
                          View All <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                      <div className="p-4 md:p-6">
                        {locationError ? (
                          <div className="bg-blue-900 rounded-lg p-4 text-center border border-blue-700">
                            <AlertTriangle className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
                            <p className="text-sm text-blue-200 mb-3">{locationError}</p>
                            <LocationPermissionIcon />
                          </div>
                        ) : nearbyUsers.length > 0 ? (
                          <div className="space-y-4">
                            {nearbyUsers.map(user => (
                              <div key={user._id} className="flex items-start border border-blue-700 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-900 to-indigo-900 transform hover:scale-[1.02]">
                                <div className="mr-3 flex-shrink-0">
                                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
                                    <img 
                                      src={getProfilePicture(user)} 
                                      alt={`${user.firstName} ${user.lastName}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between">
                                    <h4 className="text-sm md:text-lg font-medium text-blue-100 truncate">
                                      {user.firstName} {user.lastName}
                                    </h4>
                                    <span className="text-xs text-blue-300 flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {user.distanceFormatted}
                                    </span>
                                  </div>
                                  <p className="text-xs md:text-sm text-blue-300">{user.headline || 'Athlete'}</p>
                                  
                                  <div className="mt-3 flex space-x-2">
                                    <button
                                      onClick={() => handleConnect(user._id)}
                                      disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                                      className={`flex items-center px-3 py-1.5 rounded-full text-xs ${
                                        user.connectionStatus === 'pending'
                                          ? 'bg-blue-700 text-blue-300 cursor-not-allowed'
                                          : user.connectionStatus === 'connected'
                                            ? 'bg-green-700 text-green-100 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-500'
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
                                      className="flex items-center px-3 py-1.5 rounded-full text-xs bg-indigo-700 text-white hover:bg-indigo-600 shadow-sm transition-colors"
                                    >
                                      View Profile
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                            <MapPin className="h-12 w-12 mx-auto text-blue-400 mb-3" />
                            <p className="text-blue-200 text-sm mb-3">No nearby athletes found.</p>
                            <button 
                              onClick={() => fetchNearbyUsers(userLocation?.latitude, userLocation?.longitude, 10)}
                              className="mt-2 inline-flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-md"
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
              <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl shadow-lg overflow-hidden border border-blue-700">
                <div className="p-4 md:p-6">
                  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-blue-100 mb-2 flex items-center">
                        <Activity className="h-6 w-6 mr-2 text-blue-400" />
                        Sports Events
                      </h2>
                      <p className="text-sm text-blue-300">Find matches, tournaments, and training sessions</p>
                    </div>
                    <Link to="/events/create" className="mt-3 md:mt-0">
                      <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full px-4 py-2 flex items-center justify-center transition-colors shadow-md">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Host an Event
                      </button>
                    </Link>
                  </div>
                  
                  <div className="mb-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                        <input
                          type="text"
                          placeholder="Search events..."
                          className="pl-10 w-full p-2 border border-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-900 text-white"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="ml-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-500 transition shadow-md"
                      >
                        Search
                      </button>
                    </form>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button 
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'upcoming' ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-800 text-blue-300 hover:bg-blue-700'}`}
                        onClick={() => setFilter('upcoming')}
                      >
                        Upcoming
                      </button>
                      <button 
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-800 text-blue-300 hover:bg-blue-700'}`}
                        onClick={() => setFilter('all')}
                      >
                        All Events
                      </button>
                      <button 
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'past' ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-800 text-blue-300 hover:bg-blue-700'}`}
                        onClick={() => setFilter('past')}
                      >
                        Past
                      </button>
                      
                      <div className="relative ml-auto">
                        <select
                          className="appearance-none bg-blue-900 text-blue-100 border border-blue-600 rounded-full pl-4 pr-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                          <option value="">Sports Category</option>
                          {categories.map((category, index) => (
                            <option key={`category-${index}`} value={category}>{category}</option>
                          ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Events Grid */}
                  {loadingData ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-blue-300">Loading events...</p>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-10 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                      <Calendar className="h-16 w-16 mx-auto text-blue-400 mb-3" />
                      <p className="text-blue-200 mb-4">No events found matching your criteria.</p>
                      {(searchQuery || categoryFilter !== 'All') && (
                        <button 
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-full text-blue-100 shadow-md"
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
                        <div key={event._id || event.id} className="bg-gradient-to-br from-blue-900 to-indigo-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-700 transform hover:scale-[1.02]">
                          <div className="relative">
                            <img 
                              src={event.coverImage?.url || "/api/placeholder/400/200"} 
                              alt={event.name || "Event"}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/60 to-transparent"></div>
                            {event.category && (
                              <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                {typeof event.category === 'string' ? event.category : 'Other'}
                              </span>
                            )}
                          </div>
                          
                          <div className="p-5">
                            <h3 className="text-xl font-bold text-blue-100 mb-2">{event.name || "Untitled Event"}</h3>
                            
                            <div className="flex items-center text-blue-300 mb-2">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span className="text-sm">{formatDate(event.startDateTime)}</span>
                            </div>
                            
                            <div className="flex items-center text-blue-300 mb-4">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                {event.virtual 
                                  ? "Virtual Event" 
                                  : (event.location?.name || "Location TBA")}
                              </span>
                            </div>
                            
                            <div className="flex justify-end">
                              <Link to={`/events/${event._id || event.id}`}>
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-md flex items-center">
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
                    <Link to="/events" className="inline-block bg-blue-700 hover:bg-blue-600 text-blue-100 font-medium py-2 px-6 rounded-full shadow-md transition-colors">
                      View All Events →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'network' && (
              <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl shadow-lg overflow-hidden border border-blue-700">
                <div className="p-4 md:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-blue-100 mb-2 flex items-center">
                      <Users className="h-6 w-6 mr-2 text-blue-400" />
                      Your Sports Network
                    </h2>
                    <p className="text-sm text-blue-300">Connect with athletes and trainers in your area</p>
                  </div>
                  
                  {/* Connection requests and nearby professionals */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-blue-900 bg-opacity-50 rounded-xl p-4 md:p-6 border border-blue-700 shadow-md">
                      <h3 className="text-base md:text-lg font-semibold text-blue-100 mb-4 flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-blue-400" />
                        Teammate Requests
                      </h3>
                      {pendingRequests > 0 ? (
                        <div className="space-y-3 md:space-y-4">
                          {connectionRequests.slice(0, 3).map(request => (
                            <div key={request._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-800 to-indigo-900 p-4 rounded-lg shadow-md border border-blue-700 transform hover:scale-[1.02] transition-all duration-200">
                              <div className="flex items-center mb-3 sm:mb-0">
                                <div className="h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden border-2 border-blue-500 shadow-md mr-3">
                                  <img 
                                    src={getProfilePicture(request)} 
                                    alt={`${request?.firstName || 'User'} ${request?.lastName || ''}`} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm md:text-base text-blue-100">{request?.firstName || 'User'} {request?.lastName || ''}</h4>
                                  <p className="text-xs md:text-sm text-blue-300">{request?.headline || 'Athlete'}</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleAcceptConnection(request._id)}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs md:text-sm hover:bg-blue-500 shadow-md transition-colors"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleDeclineConnection(request._id)}
                                  className="bg-blue-800 text-blue-300 px-3 py-1.5 rounded-full text-xs md:text-sm hover:bg-blue-700 shadow-md transition-colors"
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          ))}
                          {connectionRequests.length > 3 && (
                            <Link to="/network" className="block w-full text-center bg-blue-800 text-blue-200 py-2 rounded-full mt-4 text-sm hover:bg-blue-700 transition-colors shadow-md">
                              View All Requests ({connectionRequests.length}) →
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-blue-800 bg-opacity-40 rounded-lg border border-blue-700">
                          <UserPlus className="h-12 w-12 mx-auto text-blue-400 mb-3" />
                          <p className="text-blue-200 mb-3">No pending teammate requests</p>
                          <Link to="/network/discover" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-500 shadow-md transition-colors">
                            Find Teammates →
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {/* Nearby Athletes Card */}
                    <div className="bg-blue-900 bg-opacity-50 rounded-xl p-4 md:p-6 border border-blue-700 shadow-md">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                          <h3 className="text-base md:text-lg font-semibold text-blue-100">Nearby Athletes</h3>
                        </div>
                        <Link to="/network/nearby" className="text-xs md:text-sm text-blue-300 hover:text-blue-200 flex items-center">
                          See All <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                      
                      {/* User Cards */}
                      {locationError ? (
                        <div className="bg-blue-800 bg-opacity-40 rounded-xl p-6 text-center border border-blue-700">
                          <div className="flex flex-col items-center justify-center">
                            <AlertTriangle className="h-12 w-12 text-yellow-400 mb-3" />
                            <h3 className="text-lg font-semibold text-blue-100 mb-2">Location Error</h3>
                            <p className="text-sm text-blue-300 mb-4">{locationError}</p>
                            <button
                              onClick={() => fetchNearbyUsers(userLocation?.latitude, userLocation?.longitude, 10)}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-500 transition-colors shadow-md"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Try Again
                            </button>
                          </div>
                        </div>
                      ) : nearbyUsers.length > 0 ? (
                        <div className="space-y-4">
                          {nearbyUsers.map(user => (
                            <div key={user._id} className="flex items-start p-4 md:p-5 border border-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-800 to-indigo-900 transform hover:scale-[1.02]">
                              {/* User image */}
                              <div className="mr-4">
                                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
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
                                    <h3 className="text-base md:text-lg font-medium text-blue-100 truncate">
                                      {user.firstName} {user.lastName}
                                    </h3>
                                    <p className="text-xs md:text-sm text-blue-300 truncate">{user.headline || 'Athlete'}</p>
                                  </div>
                                  
                                  {user.distance !== undefined && (
                                    <span className="mt-1 md:mt-0 text-xs text-blue-400 flex items-center md:ml-2">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {user.distanceFormatted || formatDistance(user.distance)}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Industry and skills */}
                                {user.industry && (
                                  <div className="mt-1 text-xs text-blue-300">
                                    <span className="font-medium">Sport:</span> {user.industry}
                                  </div>
                                )}
                                
                                {/* Action buttons */}
                                <div className="mt-3 flex space-x-2">
                                  <button
                                    onClick={() => handleConnect(user._id)}
                                    disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                                    className={`flex items-center px-3 py-1.5 rounded-full text-xs ${
                                      user.connectionStatus === 'pending'
                                        ? 'bg-blue-700 text-blue-300 cursor-not-allowed'
                                        : user.connectionStatus === 'connected'
                                          ? 'bg-green-700 text-green-100 cursor-not-allowed'
                                          : 'bg-blue-600 text-white hover:bg-blue-500'
                                    } shadow-md transition-colors`}
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    {user.connectionStatus === 'pending'
                                      ? 'Pending'
                                      : user.connectionStatus === 'connected'
                                        ? 'Teammates'
                                        : 'Connect'}
                                  </button>
                                  
                                  <Link
                                    to={`/profile/${user._id}`}
                                    className="flex items-center px-3 py-1.5 rounded-full text-xs bg-indigo-700 text-white hover:bg-indigo-600 shadow-md transition-colors"
                                  >
                                    View Profile
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <Link to="/network/nearby" className="block w-full text-center bg-blue-800 text-blue-200 py-2 rounded-full mt-2 text-sm hover:bg-blue-700 transition-colors shadow-md">
                            Find More Athletes →
                          </Link>
                        </div>
                      ) : (
                        <div className="bg-blue-800 bg-opacity-40 rounded-xl p-6 text-center border border-blue-700">
                          <div className="inline-flex h-16 w-16 rounded-full bg-blue-700 items-center justify-center mb-4">
                            <MapPin className="h-8 w-8 text-blue-300" />
                          </div>
                          <h3 className="text-xl font-semibold text-blue-100 mb-2">No Nearby Athletes</h3>
                          <p className="text-sm text-blue-300 mb-4">
                            {userLocation 
                              ? "We couldn't find any athletes near your current location." 
                              : "Please enable location services to see athletes near you."}
                          </p>
                          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <button 
                              onClick={() => fetchNearbyUsers(userLocation?.latitude, userLocation?.longitude, 10)}
                              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-md"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Location
                            </button>
                            <Link
                              to="/network/nearby"
                              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-indigo-700 text-white rounded-full hover:bg-indigo-600 shadow-md"
                            >
                              Explore Network
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-4 md:py-5 mt-6 border-t border-blue-700">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-xs md:text-sm text-blue-200">© 2023 SportConnect • Privacy Policy • Terms of Service</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MergedDashboard;
