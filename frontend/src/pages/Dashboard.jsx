import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { 
  Search, Calendar, MapPin, Filter, ArrowUpDown, PlusCircle, Check, X, 
  User, AlertTriangle, ChevronRight, Users, Rss, Home, Bell, 
  MessageCircle, Briefcase, Settings, LogOut, RefreshCw, TrendingUp,
  BarChart2, Zap, Star, UserPlus, Activity, Clock, Heart, Share2, 
  Coffee, Award, Music, Compass, BookOpen, Bookmark
} from 'lucide-react';

// Import services
import eventService from '../services/eventService';
import nearbyUsersService from '../services/nearbyUsersService';
import networkService from '../services/networkService';
import storyService from '../services/storyService';
import portfolioService from '../services/portfolioService';
import userService from '../services/userService';

// Import components
import StoryCard from '../components/posts/StoryCard';
import LocationPermissionIcon from '../components/LocationPermissionIcon';

// Default profile picture
import defaultProfilePic from '../assets/default-avatar.png';

const EventCard = ({ event }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    
    try {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid date";
    }
  };
  
  // Safely get the attendee count
  const getAttendeeCount = (attendeeCounts, type) => {
    if (!attendeeCounts) return 0;
    
    const count = attendeeCounts[type];
    
    if (typeof count === 'number') {
      return count;
    }
    
    if (count && typeof count === 'object' && count.count !== undefined) {
      return count.count;
    }
    
    return 0;
  };

  // Get the going count
  const goingCount = getAttendeeCount(event.attendeeCounts, 'going');
  
  // Get appropriate category icon
  const getCategoryIcon = (category) => {
    if (!category) return <Calendar className="h-4 w-4 text-orange-500" />;
    
    const categoryLower = typeof category === 'string' ? category.toLowerCase() : '';
    
    switch (categoryLower) {
      case 'business':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'technology':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'social':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'education':
        return <BookOpen className="h-4 w-4 text-amber-500" />;
      case 'entertainment':
        return <Music className="h-4 w-4 text-pink-500" />;
      case 'health':
        return <Activity className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-orange-500" />;
    }
  };
  
  // Get category color class
  const getCategoryColorClass = (category) => {
    if (!category) return "bg-orange-500";
    
    const categoryLower = typeof category === 'string' ? category.toLowerCase() : '';
    
    switch (categoryLower) {
      case 'business':
        return "bg-blue-500";
      case 'technology':
        return "bg-purple-500";
      case 'social':
        return "bg-green-500";
      case 'education':
        return "bg-amber-500";
      case 'entertainment':
        return "bg-pink-500";
      case 'health':
        return "bg-red-500";
      default:
        return "bg-orange-500";
    }
  };
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={event.coverImage?.url || "/api/placeholder/400/200"} 
          alt={event.name || "Event"}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        {event.category && (
          <span className={`absolute top-4 right-4 ${getCategoryColorClass(event.category)} text-white text-xs font-bold px-3 py-1 rounded-full`}>
            {typeof event.category === 'string' ? event.category : 'Other'}
          </span>
        )}
        <div className="absolute bottom-0 left-0 w-full p-4">
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 drop-shadow-sm">{event.name || "Untitled Event"}</h3>
          <div className="flex items-center text-white/90 space-x-3">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              <span className="text-sm">{formatDate(event.startDateTime)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span className="text-sm truncate max-w-[120px]">
                {event.virtual 
                  ? "Virtual Event" 
                  : (event.location?.name || "Location TBA")}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
          {event.description || "Join us for this exciting event!"}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, goingCount || 2))].map((_, i) => (
                <div key={`avatar-${i}-${event._id || event.id}`} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">
              {goingCount || '5+'} attending
            </span>
          </div>
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-orange-500 transition-colors">
              <Heart className="h-5 w-5" />
            </button>
            <Link to={`/events/${event._id || event.id}`}>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300">
                View
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedEventCard = ({ event }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    
    try {
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid date";
    }
  };
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={event?.coverImage?.url || "/api/placeholder/800/400"} 
          alt={event?.name || "Featured Event"}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute top-4 left-4">
          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Featured
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6">
          <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-sm">{event?.name || "Featured Event"}</h3>
          <div className="flex flex-wrap items-center text-white/90 space-x-4 mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="text-sm md:text-base">{formatDate(event?.startDateTime)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="text-sm md:text-base">
                {event?.virtual 
                  ? "Virtual Event" 
                  : (event?.location?.name || "Location TBA")}
              </span>
            </div>
          </div>
          <Link to={`/events/${event?._id || event?.id}`}>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const GlamorousHomePage = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const toastContext = useToast();
  const toast = toastContext?.toast;
  const locationControlRef = useRef(null);

  // State for events
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([
    "All", "Business", "Technology", "Social", "Education", "Entertainment", "Health", "Other"
  ]);

  // State for dashboard data
  const [stories, setStories] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [allNearbyUsers, setAllNearbyUsers] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [userStreaks, setUserStreaks] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 0,
    connections: 0,
    streaks: 0,
    projects: 0
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [pendingRequests, setPendingRequests] = useState(0);
  
  // Planner/To-Do list state
  const [planner, setPlanner] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [sideWidgetView, setSideWidgetView] = useState('tasks'); // 'tasks', 'streaks', 'connections'

  // Special states for enhanced design
  const [suggestedPeople, setSuggestedPeople] = useState([]);
  const [highlightedEvent, setHighlightedEvent] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for header effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const apiFilters = { filter: 'upcoming', limit: 10 };
        
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
        
        // Set the first event as highlighted
        if (eventsData.length > 0) {
          setHighlightedEvent(eventsData[0]);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        if (toast) {
          toast({
            title: "Failed to load events",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } finally {
        setLoadingEvents(false);
      }
    };
    
    fetchEvents();
  }, [categoryFilter, searchQuery, toast]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    // The useEffect will trigger a new API call
  };

  // Get user's location and fetch nearby users
  const getUserLocation = () => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ 
            latitude, 
            longitude, 
            accuracy,
            timestamp: new Date().toISOString()
          });
          
          fetchNearbyUsers(latitude, longitude, 10);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage;
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location services for this site.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Your location is currently unavailable. Please try again later.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "Unknown location error. Please try again.";
          }
          
          setLocationError(errorMessage);
        },
        options
      );
    } else {
      setLocationError("Geolocation is not supported by your browser. Please use a modern browser.");
    }
  };

  // Fetch nearby users
  const fetchNearbyUsers = async (latitude, longitude, distance) => {
    try {
      const nearbyResponse = await nearbyUsersService.getNearbyUsers({
        latitude,
        longitude,
        distance
      });
      
      if (!Array.isArray(nearbyResponse)) {
        throw new Error("Invalid response format from server");
      }
      
      let connections = [];
      try {
        connections = await networkService.getConnections('all');
      } catch (connectionError) {
        console.error('Error fetching connections:', connectionError);
        connections = [];
      }
      
      const connectionIds = new Set(
        Array.isArray(connections) 
          ? connections.map(conn => conn._id)
          : []
      );
      
      const filteredUsers = nearbyResponse.filter(user => !connectionIds.has(user._id));
      
      const enhancedUsers = filteredUsers.map(user => ({
        ...user,
        lastActiveFormatted: user.lastActive ? formatTimeAgo(new Date(user.lastActive)) : null,
        distanceFormatted: user.distanceFormatted || formatDistance(user.distance)
      }));
      
      setAllNearbyUsers(enhancedUsers);
      setNearbyUsers(enhancedUsers.slice(0, 4));
      
      // Generate suggested people by shuffling and taking first few
      const shuffled = [...enhancedUsers].sort(() => 0.5 - Math.random());
      setSuggestedPeople(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error fetching nearby professionals:', error);
      setLocationError(error.message || "Failed to fetch nearby professionals");
      setNearbyUsers([]);
      setAllNearbyUsers([]);
    }
  };

  // Helper function to format distance
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

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return 'Just now';
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  };

  // Format date for display
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

  // Get profile picture with fallback
  const getProfilePicture = (userObj) => {
    if (userObj?.profilePicture) {
      return userObj.profilePicture;
    }
    return defaultProfilePic;
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
      
      setAllNearbyUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, connectionStatus: 'pending' } 
            : user
        )
      );
      
      setSuggestedPeople(prev => 
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

  // Handle accepting connection request
  const handleAcceptConnection = async (userId) => {
    try {
      await networkService.acceptConnection(userId);
      // Update the pending requests list
      setPendingRequests(prev => prev - 1);
      // Remove the accepted request from the list
      setConnectionRequests(prev => prev.filter(req => req._id !== userId));
      // Update connections count
      setDashboardStats(prev => ({
        ...prev,
        connections: prev.connections + 1
      }));
      
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

  // Handle declining connection request
  const handleDeclineConnection = async (userId) => {
    try {
      await networkService.declineConnection(userId);
      // Update the pending requests list
      setPendingRequests(prev => prev - 1);
      // Remove the declined request from the list
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
    
    // Save to localStorage
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
    
    // Save to localStorage
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
    }
  };

  const deleteTask = (taskId) => {
    const updatedPlanner = planner.filter(task => task.id !== taskId);
    setPlanner(updatedPlanner);
    
    // Save to localStorage
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoadingDashboard(true);
      
      try {
        // Array of fetch promises - each wrapped in a try/catch
        const fetchPromises = [
          // Profile Views
          (async () => {
            try {
              return await userService.getProfileViewAnalytics();
            } catch (error) {
              console.error('Error fetching profile view analytics:', error);
              return { totalViews: 0, views: [] }; 
            }
          })(),
          
          // Connections
          (async () => {
            try {
              return await networkService.getConnections('all');
            } catch (error) {
              console.error('Error fetching connections:', error);
              return []; 
            }
          })(),
          
          // Pending Requests
          (async () => {
            try {
              return await networkService.getConnectionRequests();
            } catch (error) {
              console.error('Error fetching connection requests:', error);
              return [];
            }
          })(),
          
          // Streaks
          (async () => {
            try {
              return await portfolioService.getStreaks(user._id, { limit: 5, active: true });
            } catch (error) {
              console.error('Error fetching user streaks:', error);
              return { items: [] };
            }
          })(),
          
          // Projects
          (async () => {
            try {
              return await portfolioService.getProjects(user._id, { limit: 5 });
            } catch (error) {
              console.error('Error fetching user projects:', error);
              return { items: [] };
            }
          })(),
          
          // Achievements
          (async () => {
            try {
              return await portfolioService.getAchievements(user._id, { limit: 3 });
            } catch (error) {
              console.error('Error fetching user achievements:', error);
              return { items: [] };
            }
          })(),
          
          // Stories
          (async () => {
            try {
              const response = await storyService.getStories({ limit: 5 });
              return response;
            } catch (error) {
              console.error('Error fetching stories:', error);
              return { stories: [] };
            }
          })()
        ];
        
        // Wait for all promises to settle
        const results = await Promise.all(fetchPromises);
        
        // Destructure results with fallbacks for null values
        const [
          profileViewData,
          connectionsData,
          pendingRequestsData,
          streaksData,
          projectsData,
          achievementsData,
          storiesData
        ] = results;
        
        // Update dashboard stats with real data and fallbacks
        setDashboardStats({
          profileViews: profileViewData?.totalViews || 27,
          connections: Array.isArray(connectionsData) ? connectionsData.length : 42,
          streaks: streaksData?.items?.length || 3,
          projects: projectsData?.items?.length || 5
        });
        
        // Update other state data - add null checks
        setPendingRequests(Array.isArray(pendingRequestsData) ? pendingRequestsData.length : 0);
        setConnectionRequests(pendingRequestsData || []);
        setUserStreaks(streaksData?.items || []);
        setUserProjects(projectsData?.items || []);
        setUserAchievements(achievementsData?.items || []);
        setStories(storiesData?.stories || []);
        
        // Load planner from local storage if exists
        const savedPlanner = localStorage.getItem('userPlanner');
        if (savedPlanner) {
          try {
            setPlanner(JSON.parse(savedPlanner));
          } catch (error) {
            console.error('Error parsing planner from localStorage:', error);
            setPlanner([]);
          }
        }
        
        // Get user location
        getUserLocation();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default/fallback values for all states
        setDashboardStats({
          profileViews: 27,
          connections: 42,
          streaks: 3,
          projects: 5
        });
        setPendingRequests(0);
        setConnectionRequests([]);
        setUserStreaks([]);
        setUserProjects([]);
        setUserAchievements([]);
        setStories([]);
      } finally {
        setLoadingDashboard(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // Generate date for calendar display
  const getCurrentDateDisplay = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
      month: now.toLocaleDateString('en-US', { month: 'long' }),
      year: now.getFullYear()
    };
  };

  const dateInfo = getCurrentDateDisplay();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section with Calendar-style Header */}
      <div className={`relative bg-gradient-to-r from-orange-600 to-orange-400 pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden ${isScrolled ? 'shadow-lg' : ''} transition-all duration-300`}>
        {/* Decorative elements */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-orange-300"></div>
          <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-orange-300"></div>
          <div className="absolute left-1/4 bottom-0 h-40 w-40 rounded-full bg-orange-300"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Calendar-style greeting */}
            <div className="flex items-center mb-6 md:mb-0">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-white shadow-md mr-4 flex flex-col items-center justify-center transform hover:rotate-3 transition-transform">
                <span className="text-orange-500 font-bold text-2xl md:text-3xl">{dateInfo.day}</span>
                <span className="text-orange-500 text-xs uppercase">{dateInfo.month.slice(0, 3)}</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {user ? `${getGreeting()}, ${user.firstName || 'there'}!` : 'Welcome to MeetKats!'}
                </h1>
                <p className="text-orange-100">{dateInfo.weekday}, {dateInfo.month} {dateInfo.day}, {dateInfo.year}</p>
              </div>
            </div>
            
            {/* Quick Action Buttons - Only for logged in users */}
            {user && (
              <div className="flex space-x-2">
                <Link to="/events/create">
                  <button className="flex items-center bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 transition-all duration-300 shadow-sm hover:shadow">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Event
                  </button>
                </Link>
                <Link to="/posts/create">
                  <button className="flex items-center bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-800 transition-all duration-300 shadow-sm hover:shadow">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Post
                  </button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center bg-white p-2 rounded-xl shadow-lg">
              <div className="flex items-center flex-1 w-full">
                <Search className="h-5 w-5 text-gray-400 ml-2" />
                <input
                  type="text"
                  placeholder="Search events, people, and more..."
                  className="flex-1 p-2 ml-2 focus:outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="mt-3 sm:mt-0 w-full sm:w-auto px-6 py-3 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition-all duration-300 shadow-sm hover:shadow"
              >
                Search
              </button>
            </form>
          </div>
          
          {/* Quick Stats for Logged In Users */}
          {user && !loadingDashboard && (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-90 rounded-xl p-4 shadow-md backdrop-blur-sm transform hover:scale-105 transition-transform cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-orange-500 font-semibold">Profile Views</p>
                  <BarChart2 className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{dashboardStats.profileViews}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> Career visibility
                </p>
              </div>
              <div className="bg-white bg-opacity-90 rounded-xl p-4 shadow-md backdrop-blur-sm transform hover:scale-105 transition-transform cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-orange-500 font-semibold">Connections</p>
                  <Users className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{dashboardStats.connections}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> Network growth
                </p>
              </div>
              <div className="bg-white bg-opacity-90 rounded-xl p-4 shadow-md backdrop-blur-sm transform hover:scale-105 transition-transform cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-orange-500 font-semibold">Streaks</p>
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{dashboardStats.streaks}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> Active habits
                </p>
              </div>
              <div className="bg-white bg-opacity-90 rounded-xl p-4 shadow-md backdrop-blur-sm transform hover:scale-105 transition-transform cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-orange-500 font-semibold">Requests</p>
                  {pendingRequests > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {pendingRequests}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-800">{pendingRequests}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> Pending connections
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-12">
        {/* Main Grid Layout - 3 columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Only visible for logged in users */}
          {user && (
            <div className="lg:col-span-3">
              {/* User Profile Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 transform hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  <div className="h-20 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                  <div className="absolute top-12 left-4">
                    <div className="h-16 w-16 rounded-lg border-4 border-white bg-white flex items-center justify-center shadow-md overflow-hidden">
                      <img
                        src={getProfilePicture(user)}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-12 pb-5 px-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {user?.firstName || 'User'} {user?.lastName || ''}
                      </h2>
                      <p className="text-xs text-gray-500">{user?.headline || 'Professional Title'}</p>
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
                  
                  <div className="mt-4 bg-orange-50 rounded-lg p-3">
                    <div className="text-xs">
                      <p className="font-medium text-gray-900">Profile Completion: 68%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Link 
                        to="/profile/edit" 
                        className="text-orange-600 text-xs font-medium hover:text-orange-700"
                      >
                        Complete your profile →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Widget Tabs */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 transform hover:shadow-lg transition-all duration-300">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setSideWidgetView('tasks')}
                    className={`flex items-center justify-center flex-1 py-3 text-sm font-medium transition-colors ${
                      sideWidgetView === 'tasks'
                        ? 'text-orange-600 border-b-2 border-orange-500'
                        : 'text-gray-500 hover:text-orange-600'
                    }`}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    My Tasks
                  </button>
                  <button
                    onClick={() => setSideWidgetView('streaks')}
                    className={`flex items-center justify-center flex-1 py-3 text-sm font-medium transition-colors ${
                      sideWidgetView === 'streaks'
                        ? 'text-orange-600 border-b-2 border-orange-500'
                        : 'text-gray-500 hover:text-orange-600'
                    }`}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Streaks
                  </button>
                  <button
                    onClick={() => setSideWidgetView('connections')}
                    className={`flex items-center justify-center flex-1 py-3 text-sm font-medium transition-colors ${
                      sideWidgetView === 'connections'
                        ? 'text-orange-600 border-b-2 border-orange-500'
                        : 'text-gray-500 hover:text-orange-600'
                    }`}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Requests
                  </button>
                </div>

                {/* Task Planner Content */}
                {sideWidgetView === 'tasks' && (
                  <div className="p-4">
                    {/* Add new task */}
                    <div className="flex mb-4">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      />
                      <button
                        onClick={addTask}
                        className="bg-orange-500 text-white rounded-r-md px-3 py-2 text-xs hover:bg-orange-600 transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Task list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {planner.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-xs">No tasks yet. Add your first task above.</p>
                        </div>
                      ) : (
                        planner.map(task => (
                          <div 
                            key={task.id} 
                            className={`flex items-center justify-between p-2 border rounded-md ${
                              task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                            } hover:shadow-sm transition-shadow`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <button
                                onClick={() => toggleTaskCompletion(task.id)}
                                className={`flex-shrink-0 h-4 w-4 rounded-full border ${
                                  task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                } mr-2 flex items-center justify-center transition-colors duration-300`}
                              >
                                {task.completed && <Check className="h-2 w-2 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {task.text}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  Added {formatDate(task.date)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Streaks Content */}
                {sideWidgetView === 'streaks' && (
                  <div className="p-4">
                    {userStreaks.length > 0 ? (
                      <div className="space-y-3">
                        {userStreaks.map(streak => (
                          <div key={streak._id} className="flex border border-gray-200 p-2 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="mr-3 flex-shrink-0">
                              <div className="h-12 w-12 rounded-lg bg-green-100 flex flex-col items-center justify-center">
                                <span className="text-green-600 text-xs font-semibold">
                                  Day
                                </span>
                                <span className="text-green-600 text-base font-bold">
                                  {streak.currentStreak || 0}
                                </span>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-900">{streak.title || 'Streak'}</h4>
                              <p className="text-xs text-gray-500 mt-1">{streak.activity || ''}</p>
                              <div className="mt-2">
                                <Link 
                                  to={`/portfolio/streaks/${streak._id}`}
                                  className="inline-block bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                                >
                                  Check In
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link to="/portfolio/streaks" className="block text-center text-orange-500 font-medium text-xs mt-2 hover:underline">
                          View All Streaks →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No active streaks</p>
                        <Link 
                          to="/portfolio/streak/new" 
                          className="mt-2 text-orange-500 hover:text-orange-600 text-xs font-medium hover:underline"
                        >
                          Start a Streak →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Connection Requests Content */}
                {sideWidgetView === 'connections' && (
                  <div className="p-4">
                    {pendingRequests > 0 ? (
                      <div className="space-y-3">
                        {connectionRequests.map(request => (
                          <div key={request._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center mb-2 sm:mb-0">
                              <div className="h-10 w-10 rounded-lg overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl mr-3">
                                <img 
                                  src={getProfilePicture(request)} 
                                  alt={`${request?.firstName || 'User'} ${request?.lastName || ''}`} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{request?.firstName || 'User'} {request?.lastName || ''}</h4>
                                <p className="text-xs text-gray-500">{request?.headline || 'Professional'}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleAcceptConnection(request._id)}
                                className="bg-orange-500 text-white px-2 py-1 rounded-md text-xs hover:bg-orange-600 transition-colors"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleDeclineConnection(request._id)}
                                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs hover:bg-gray-300 transition-colors"
                              >
                                Ignore
                              </button>
                            </div>
                          </div>
                        ))}
                        <Link to="/network" className="block w-full text-center text-orange-500 font-medium mt-4 text-xs hover:underline">
                          View All Requests →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <UserPlus className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No pending connection requests</p>
                        <Link 
                          to="/network/find" 
                          className="mt-2 text-orange-500 hover:text-orange-600 text-xs font-medium hover:underline"
                        >
                          Find People to Connect →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-xl shadow-md p-4 mb-6 transform hover:shadow-lg transition-all duration-300">
                <LocationPermissionIcon />
                
                {locationError ? (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg text-center">
                    <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-700 mb-3">{locationError}</p>
                    <button
                      onClick={getUserLocation}
                      className="inline-flex items-center px-3 py-1 bg-orange-500 text-white rounded-md text-xs hover:bg-orange-600 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Try Again
                    </button>
                  </div>
                ) : userLocation ? (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Your location:</span> Using your current location
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Nearby Users Preview */}
              {nearbyUsers.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300">
                  <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800 text-sm">Nearby Professionals</h3>
                    <Link to="/network/nearby" className="text-orange-500 hover:text-orange-600 text-xs">View All</Link>
                  </div>
                  <div className="p-4 space-y-3">
                    {nearbyUsers.slice(0, 2).map(user => (
                      <div key={user._id} className="flex items-start hover:bg-orange-50 p-2 rounded-lg transition-colors">
                        <div className="h-10 w-10 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                          <img 
                            src={getProfilePicture(user)} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">{user.headline || 'Professional'}</p>
                          
                          <div className="mt-1 flex items-center">
                            <MapPin className="h-3 w-3 text-orange-500 mr-1" />
                            <span className="text-xs">{user.distanceFormatted || formatDistance(user.distance)}</span>
                          </div>
                          
                          <button
                            onClick={() => handleConnect(user._id)}
                            disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                            className={`mt-2 flex items-center px-2 py-1 rounded text-xs ${
                              user.connectionStatus === 'pending'
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : user.connectionStatus === 'connected'
                                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            } transition-colors`}
                          >
                            {user.connectionStatus === 'pending'
                              ? 'Pending'
                              : user.connectionStatus === 'connected'
                                ? 'Connected'
                                : 'Connect'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Main Content Area */}
          <div className={user ? "lg:col-span-6" : "lg:col-span-9"}>
            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
              <div className="flex overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`flex-none text-center py-3 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeTab === 'explore'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Explore Events
                </button>
                <button
                  onClick={() => setActiveTab('featured')}
                  className={`flex-none text-center py-3 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeTab === 'featured'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  Featured
                </button>
                <button
                  onClick={() => setActiveTab('nearby')}
                  className={`flex-none text-center py-3 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeTab === 'nearby'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Nearby
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`flex-none text-center py-3 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                    activeTab === 'trending'
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </div>
                </button>
              </div>
            </div>
            
            {/* Category Filters */}
            <div className="flex overflow-x-auto py-2 mb-6 space-x-2 scrollbar-hide">
              {categories.map((category, index) => (
                <button 
                  key={`category-${index}`}
                  className={`flex-none px-4 py-2 rounded-full text-sm ${
                    categoryFilter === category 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'bg-white text-gray-700 hover:bg-orange-100'
                  } transition-all duration-300`}
                  onClick={() => setCategoryFilter(category === 'All' ? '' : category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Content based on active tab */}
            {activeTab === 'explore' && (
              <>
                {/* Featured Event */}
                {highlightedEvent && !loadingEvents && (
                  <section className="mb-6">
                    <FeaturedEventCard event={highlightedEvent} />
                  </section>
                )}
              
                {/* Events Section */}
                <section className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
                    <Link to="/events" className="text-orange-500 hover:text-orange-600 flex items-center text-sm group">
                      View All <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  
                  {loadingEvents ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center bg-white rounded-xl shadow-md p-8">
                      <Calendar className="h-10 w-10 text-orange-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Events Found</h3>
                      <p className="text-gray-600 mb-4">There are no upcoming events matching your criteria.</p>
                      <button
                        onClick={() => setCategoryFilter('')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        View All Events
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {events.slice(highlightedEvent ? 1 : 0, highlightedEvent ? 5 : 4).map((event) => (
                        <EventCard 
                          key={event._id || event.id || `event-${Math.random()}`} 
                          event={event} 
                        />
                      ))}
                    </div>
                  )}
                </section>
                
                {/* Stories Section - only show if user is logged in */}
                {user && stories.length > 0 && (
                  <section className="mb-6">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300">
                      <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">Recent Stories</h3>
                        <Link to="/stories" className="text-orange-500 hover:text-orange-600 text-sm">View All</Link>
                      </div>
                      <div className="p-4">
                        <StoryCard stories={stories} />
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
            
            {activeTab === 'nearby' && (
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Nearby Events & Professionals</h2>
                  
                  {/* Location Status */}
                  {locationError ? (
                    <div className="bg-orange-50 rounded-xl p-4 text-center mb-6">
                      <div className="flex flex-col items-center justify-center">
                        <AlertTriangle className="h-10 w-10 text-orange-500 mb-2" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Location Error</h3>
                        <p className="text-sm text-gray-600 mb-3">{locationError}</p>
                        <button
                          onClick={getUserLocation}
                          className="inline-flex items-center px-3 py-1.5 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 transition-colors"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Nearby Events */}
                  <div className="bg-white rounded-xl shadow-md p-4 mb-6 transform hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Events Near You</h3>
                      <Link to="/events" className="text-orange-500 hover:text-orange-600 flex items-center text-sm group">
                        View All <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    
                    {loadingEvents ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
                      </div>
                    ) : events.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {events.slice(0, 2).map((event) => (
                          <EventCard 
                            key={event._id || event.id || `event-${Math.random()}`} 
                            event={event} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-10 w-10 text-orange-300 mx-auto mb-3" />
                        <p className="text-gray-500">No nearby events found</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Nearby Professionals */}
                  <div className="bg-white rounded-xl shadow-md p-4 transform hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Professionals Near You</h3>
                      <Link to="/network/nearby" className="text-orange-500 hover:text-orange-600 flex items-center text-sm group">
                        View All <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    
                    {allNearbyUsers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {allNearbyUsers.slice(0, 4).map(user => (
                          <div key={user._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:bg-orange-50">
                            <div className="flex items-start">
                              <div className="h-12 w-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                                <img 
                                  src={getProfilePicture(user)} 
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-medium text-gray-900 truncate">
                                  {user.firstName} {user.lastName}
                                </h4>
                                <p className="text-xs text-gray-600 truncate">{user.headline || 'Professional'}</p>
                                
                                <div className="mt-1 flex items-center">
                                  <MapPin className="h-3 w-3 text-orange-500 mr-1" />
                                  <span className="text-xs">{user.distanceFormatted || formatDistance(user.distance)}</span>
                                </div>
                                
                                <div className="mt-2 flex space-x-2">
                                  <button
                                    onClick={() => handleConnect(user._id)}
                                    disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                                    className={`flex items-center px-2 py-1 rounded text-xs ${
                                      user.connectionStatus === 'pending'
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : user.connectionStatus === 'connected'
                                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    } transition-colors`}
                                  >
                                    {user.connectionStatus === 'pending'
                                      ? 'Pending'
                                      : user.connectionStatus === 'connected'
                                        ? 'Connected'
                                        : 'Connect'}
                                  </button>
                                  
                                  <Link
                                    to={`/profile/${user._id}`}
                                    className="flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                  >
                                    View
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : locationError ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Please enable location to see nearby professionals</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-10 w-10 text-orange-300 mx-auto mb-3" />
                        <p className="text-gray-500">Looking for professionals near you...</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
            
            {activeTab === 'featured' && (
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Featured Content</h2>
                  
                  {/* Featured Event - Large Card */}
                  <div className="bg-white rounded-xl overflow-hidden shadow-md mb-6 transform hover:shadow-lg transition-all duration-300">
                    {loadingEvents ? (
                      <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                      </div>
                    ) : events.length > 0 ? (
                      <>
                        <div className="relative h-48">
                          <img 
                            src={events[0]?.coverImage?.url || "/api/placeholder/800/400"} 
                            alt={events[0]?.name || "Featured Event"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                              Featured
                            </span>
                            <h3 className="text-2xl font-bold mb-2">{events[0]?.name || "Featured Event"}</h3>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="text-sm">{formatDate(events[0]?.startDateTime)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span className="text-sm">
                                  {events[0]?.virtual 
                                    ? "Virtual Event" 
                                    : (events[0]?.location?.name || "Location TBA")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-600 mb-4">
                            {events[0]?.description?.substring(0, 150) || "Join us for this exciting featured event!"}{events[0]?.description?.length > 150 ? '...' : ''}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white" />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                12+ attending
                              </span>
                            </div>
                            <Link to={`/events/${events[0]?._id || events[0]?.id}`}>
                              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
                                View Details
                              </button>
                            </Link>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-12 text-center">
                        <Calendar className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Featured Events</h3>
                        <p className="text-gray-600">Check back later for featured events.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Featured Events Grid */}
                  {events.length > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      {events.slice(1, 3).map((event) => (
                        <EventCard 
                          key={event._id || event.id || `event-${Math.random()}`} 
                          event={event} 
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* User Achievements - For logged in users */}
                  {user && userAchievements.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-4 transform hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Your Recent Achievements</h3>
                        <Link to="/portfolio/achievements" className="text-orange-500 hover:text-orange-600 flex items-center text-sm group">
                          View All <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                      
                      <div className="space-y-4">
                        {userAchievements.map(achievement => (
                          <div key={achievement._id} className="flex border border-gray-100 rounded-xl p-4 hover:bg-orange-50 transition-colors">
                            <div className="flex-shrink-0 mr-4">
                              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                {achievement.image ? (
                                  <img 
                                    src={achievement.image} 
                                    alt={achievement.title || 'Achievement'}
                                    className="h-8 w-8 object-contain" 
                                  />
                                ) : (
                                  <Star className="h-6 w-6 text-purple-600" />
                                )}
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-base text-gray-800">{achievement.title || 'Untitled Achievement'}</h5>
                              <p className="text-xs text-gray-500">{formatDate(achievement.dateAchieved)}</p>
                              <p className="text-sm text-gray-600 mt-1">{achievement.description || ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
            
            {activeTab === 'trending' && (
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Trending Now</h2>
                  
                  {/* Trending Events */}
                  {loadingEvents ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                  ) : events.length > 0 ? (
                    <>
                      <div className="bg-white rounded-xl shadow-md p-4 mb-6 transform hover:shadow-lg transition-all duration-300">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Trending This Week</h3>
                          <p className="text-gray-500 text-sm">The most popular events in your area</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* We're reusing the existing events as "trending" for demo purposes */}
                          {events.slice(0, 2).map((event, index) => (
                            <div key={`trending-${event._id || event.id}`} className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                              <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                                #{index + 1} Trending
                              </div>
                              <div className="h-40 overflow-hidden">
                                <img 
                                  src={event.coverImage?.url || "/api/placeholder/400/200"} 
                                  alt={event.name || "Event"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{event.name || "Untitled Event"}</h3>
                                <div className="flex items-center text-gray-600 mb-2">
                                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                                  <span className="text-sm">{formatDate(event.startDateTime)}</span>
                                </div>
                                <div className="flex items-center text-gray-600 mb-2">
                                  <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                                  <span className="text-sm line-clamp-1">
                                    {event.virtual 
                                      ? "Virtual Event" 
                                      : (event.location?.name || "Location TBA")}
                                  </span>
                                </div>
                                <Link to={`/events/${event._id || event.id}`} className="text-orange-500 hover:text-orange-600 text-sm font-medium inline-flex items-center group">
                                  View Details <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Trending Categories */}
                      <div className="bg-white rounded-xl shadow-md p-4 transform hover:shadow-lg transition-all duration-300">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Trending Categories</h3>
                          <p className="text-gray-500 text-sm">Most popular event categories this month</p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {categories.slice(1, 5).map((category, index) => (
                            <div 
                              key={`trend-cat-${index}`}
                              className="bg-orange-50 rounded-xl p-4 text-center hover:bg-orange-100 transition-colors cursor-pointer transform hover:-translate-y-1 transition-transform"
                              onClick={() => {
                                setCategoryFilter(category);
                                setActiveTab('explore');
                              }}
                            >
                              <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-lg font-bold text-orange-500">{index + 1}</span>
                              </div>
                              <h4 className="font-semibold text-gray-800 text-sm">{category}</h4>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center bg-white rounded-xl shadow-md p-12">
                      <TrendingUp className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Trending Events</h3>
                      <p className="text-gray-600 mb-6">Check back later for trending events.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
          
          {/* Right Sidebar */}
          <div className="lg:col-span-3">
            {/* Suggested People Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 transform hover:shadow-lg transition-all duration-300">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-medium text-gray-800">Suggested People</h3>
              </div>
              <div className="p-4">
                {loadingDashboard ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : suggestedPeople.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedPeople.slice(0, 5).map((user) => (
                      <div key={user._id} className="flex border border-gray-100 rounded-lg p-3 hover:bg-orange-50 transition-colors">
                        <div className="h-12 w-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                          <img 
                            src={getProfilePicture(user)} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{user.headline || 'Professional'}</p>
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => handleConnect(user._id)}
                              disabled={user.connectionStatus === 'pending' || user.connectionStatus === 'connected'}
                              className={`flex items-center px-2 py-1 rounded text-xs ${
                                user.connectionStatus === 'pending'
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : user.connectionStatus === 'connected'
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              } transition-colors`}
                            >
                              {user.connectionStatus === 'pending'
                                ? 'Pending'
                                : user.connectionStatus === 'connected'
                                  ? 'Connected'
                                  : 'Connect'}
                            </button>
                            <Link
                              to={`/profile/${user._id}`}
                              className="flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link to="/network/find" className="block text-center text-orange-500 font-medium text-sm pt-2 hover:underline group">
                      Find More People <ChevronRight className="inline-block h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-orange-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No suggestions available</p>
                    <Link to="/network/find" className="block text-orange-500 hover:text-orange-600 text-sm font-medium mt-2 hover:underline">
                      Find People to Connect →
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 transform hover:shadow-lg transition-all duration-300">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-medium text-gray-800">Quick Actions</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <Link to="/events/create">
                  <div className="flex flex-col items-center justify-center bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg p-3 transition-colors h-full transform hover:-translate-y-1 transition-transform">
                    <Calendar className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center">Create Event</span>
                  </div>
                </Link>
                <Link to="/posts/create">
                  <div className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-3 transition-colors h-full transform hover:-translate-y-1 transition-transform">
                    <PlusCircle className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center">New Post</span>
                  </div>
                </Link>
                <Link to="/network/find">
                  <div className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-lg p-3 transition-colors h-full transform hover:-translate-y-1 transition-transform">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center">Find People</span>
                  </div>
                </Link>
                <Link to="/portfolio/projects/new">
                  <div className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg p-3 transition-colors h-full transform hover:-translate-y-1 transition-transform">
                    <Briefcase className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center">Add Project</span>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Join Community Card - For non-logged in users */}
            {!user && (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md overflow-hidden text-white p-6 mb-6 transform hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-xl mb-3">Join Our Community</h3>
                <p className="text-orange-100 mb-4">Connect with professionals, discover events, and build your network.</p>
                <div className="space-y-2">
                  <Link to="/signup" className="block">
                    <button className="w-full bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                      Sign Up Now
                    </button>
                  </Link>
                  <Link to="/login" className="block">
                    <button className="w-full bg-orange-600 text-white border border-white hover:bg-orange-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                      Log In
                    </button>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Category Browser */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-medium text-gray-800">Browse Categories</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {categories.filter(cat => cat !== 'All').map((category, index) => (
                    <button
                      key={`cat-btn-${index}`}
                      className="flex items-center justify-center bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-lg py-2 px-3 transition-colors text-xs font-medium transform hover:-translate-y-1 transition-transform"
                      onClick={() => {
                        setCategoryFilter(category);
                        setActiveTab('explore');}}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Community Section - Always show at the bottom */}
            <section className="mt-12 mb-12">
              <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl shadow-lg overflow-hidden transform hover:shadow-xl transition-all duration-300">
                <div className="px-6 py-12 md:px-12 text-center md:text-left md:flex md:items-center">
                  <div className="md:w-2/3 mb-8 md:mb-0">
                    <h2 className="text-3xl font-bold text-white mb-4">Join Our Growing Community</h2>
                    <p className="text-orange-100 text-lg mb-6">
                      Connect with professionals, discover events, and grow your network all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <Link to="/signup">
                        <button className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300">
                          Sign Up Now
                        </button>
                      </Link>
                      <Link to="/events/create">
                        <button className="bg-orange-700 text-white hover:bg-orange-800 px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300">
                          Create Event
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className="md:w-1/3 flex justify-center">
                    <div className="bg-white bg-opacity-20 rounded-full h-48 w-48 flex items-center justify-center p-2 transform hover:rotate-3 transition-transform">
                      <div className="bg-white rounded-full h-full w-full flex items-center justify-center">
                        <Users className="h-24 w-24 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          {/* Footer */}
          <footer className="bg-gray-800 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">MeetKats</h3>
                  <p className="text-gray-400">
                    Connect, engage, and grow your professional network.
                  </p>
                  <div className="mt-4 flex space-x-4">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2">
                    <li><Link to="/events" className="text-gray-400 hover:text-white transition-colors">Events</Link></li>
                    <li><Link to="/network" className="text-gray-400 hover:text-white transition-colors">Network</Link></li>
                    <li><Link to="/posts" className="text-gray-400 hover:text-white transition-colors">Posts</Link></li>
                    <li><Link to="/portfolio" className="text-gray-400 hover:text-white transition-colors">Portfolio</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Support</h4>
                  <ul className="space-y-2">
                    <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                    <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                    <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                    <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Stay Connected</h4>
                  <p className="text-gray-400 mb-4">Subscribe to our newsletter for updates</p>
                  <div className="flex">
                    <input 
                      type="email" 
                      placeholder="Your email" 
                      className="bg-gray-700 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
                    />
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-r-lg transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                <p>© 2023 MeetKats. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      );
    };
    
    export default GlamorousHomePage;