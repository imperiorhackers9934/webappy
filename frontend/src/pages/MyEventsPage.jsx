import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plus, 
  TicketIcon, 
  ChevronRight,
  CheckCircle,
  Circle,
  X,
  Edit3,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import eventService from '../services/eventService';

const MyEventsPage = () => {
  const navigate = useNavigate();
  
  // State variables
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('upcoming'); // upcoming, past, hosting
  const [layoutType, setLayoutType] = useState('grid'); // grid or list
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current date for filtering
  const now = new Date();
  
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
  
  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "Time TBA";
    
    try {
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleTimeString('en-US', options);
    } catch (err) {
      console.error("Time formatting error:", err);
      return "Invalid time";
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
  
  // Fetch events
  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);
        
        const response = await eventService.getMyEvents();
        console.log('My events response:', response);
        
        setEvents(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching my events:', err);
        setError('Failed to load your events. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchMyEvents();
  }, []);
  
  // Filter events based on view
  const filteredEvents = () => {
    // Filter events based on search query first
    let filtered = events;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        return (
          (event.name && event.name.toLowerCase().includes(query)) ||
          (event.description && event.description.toLowerCase().includes(query)) ||
          (event.location?.name && event.location.name.toLowerCase().includes(query))
        );
      });
    }
    
    // Then filter based on view type
    switch (view) {
      case 'upcoming':
        return filtered.filter(event => {
          const eventDate = new Date(event.startDateTime);
          return eventDate >= now;
        }).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
        
      case 'past':
        return filtered.filter(event => {
          const eventDate = new Date(event.startDateTime);
          return eventDate < now;
        }).sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime)); // Sort by most recent
        
      case 'hosting':
        return filtered.filter(event => {
          return event.createdBy?._id === eventService.getCurrentUserId() ||
                 event.userRole === 'host';
        }).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
        
      default:
        return filtered;
    }
  };
  
  // Check if user is hosting an event
  const isHosting = (event) => {
    return event.createdBy?._id === eventService.getCurrentUserId() ||
           event.userRole === 'host';
  };
  
  // Handle event deletion
  const handleDeleteEvent = async (eventId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
    
    if (confirmDelete) {
      try {
        await eventService.deleteEvent(eventId);
        // Remove the deleted event from the state
        setEvents(prev => prev.filter(event => (event._id || event.id) !== eventId));
      } catch (err) {
        console.error('Error deleting event:', err);
        alert('Failed to delete event. Please try again later.');
      }
    }
  };
  
  // Grid view rendering
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents().map(event => (
          <div 
            key={event._id || event.id} 
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative">
              <img 
                src={event.coverImage?.url || "/api/placeholder/400/200"} 
                alt={event.name || "Event"}
                className="w-full h-48 object-cover"
              />
              {event.category && (
                <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {typeof event.category === 'string' ? event.category : 'Other'}
                </span>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                {isHosting(event) ? (
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Hosting
                  </span>
                ) : (
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Attending
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{event.name || "Untitled Event"}</h3>
              
              <div className="flex items-center text-gray-600 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">{formatDate(event.startDateTime)}</span>
              </div>
              
              <div className="flex items-center text-gray-600 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">{formatTime(event.startDateTime)}</span>
              </div>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {event.virtual 
                    ? "Virtual Event" 
                    : (event.location?.name || "Location TBA")}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-xs text-gray-600">
                    {getAttendeeCount(event.attendeeCounts, 'going')} attending
                  </span>
                </div>
                
                <Link to={`/events/${event._id || event.id}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View Details
                  <ChevronRight className="inline-block ml-1 w-4 h-4" />
                </Link>
              </div>
              
              {/* Action Buttons for Hosts */}
              {isHosting(event) && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <Link 
                    to={`/events/${event._id || event.id}/edit`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Link>
                  
                  <Link 
                    to={`/events/${event._id || event.id}/manage`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Users className="w-5 h-5" />
                  </Link>
                  
                  <Link 
                    to={`/events/${event._id || event.id}/tickets`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <TicketIcon className="w-5 h-5" />
                  </Link>
                  
                  <button 
                    onClick={() => handleDeleteEvent(event._id || event.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // List view rendering
  const renderListView = () => {
    return (
      <div className="space-y-4">
        {filteredEvents().map(event => (
          <div 
            key={event._id || event.id} 
            className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row hover:shadow-md transition-shadow duration-300"
          >
            <div className="sm:w-48 sm:h-24 mb-4 sm:mb-0 sm:mr-6">
              <img 
                src={event.coverImage?.url || "/api/placeholder/400/200"} 
                alt={event.name || "Event"}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{event.name || "Untitled Event"}</h3>
                  
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">{formatDate(event.startDateTime)}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <Clock className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">{formatTime(event.startDateTime)}</span>
                  </div>
                  
                  <div className="flex items-center mt-1 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">
                      {event.virtual 
                        ? "Virtual Event" 
                        : (event.location?.name || "Location TBA")}
                    </span>
                    <span className="mx-2 text-gray-300">|</span>
                    <Users className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">
                      {getAttendeeCount(event.attendeeCounts, 'going')} attending
                    </span>
                  </div>
                </div>
                
                <div className="flex items-start mt-2 sm:mt-0">
                  {isHosting(event) ? (
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Hosting
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Attending
                    </span>
                  )}
                  
                  {event.category && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {typeof event.category === 'string' ? event.category : 'Other'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <div className="flex space-x-2">
                  {isHosting(event) && (
                    <>
                      <Link 
                        to={`/events/${event._id || event.id}/edit`}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                      
                      <Link 
                        to={`/events/${event._id || event.id}/manage`}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Manage
                      </Link>
                      
                      <Link 
                        to={`/events/${event._id || event.id}/tickets`}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        <TicketIcon className="w-4 h-4 mr-1" />
                        Tickets
                      </Link>
                      
                      <button 
                        onClick={() => handleDeleteEvent(event._id || event.id)}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
                
                <Link 
                  to={`/events/${event._id || event.id}`} 
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  View Details
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
            <Link 
              to="/events/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and View Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          {/* View Toggle */}
          <div className="inline-flex bg-white rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setView('upcoming')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                view === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-y border-l border-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setView('past')}
              className={`px-4 py-2 text-sm font-medium ${
                view === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-y border-gray-300'
              }`}
            >
              Past
            </button>
            <button
              type="button"
              onClick={() => setView('hosting')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                view === 'hosting'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-y border-r border-gray-300'
              }`}
            >
              Hosting
            </button>
          </div>
          
          <div className="flex space-x-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                className="pl-9 pr-4 py-2 w-full sm:w-60 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Layout Toggle */}
            <div className="inline-flex bg-white rounded-md shadow-sm border border-gray-300" role="group">
              <button
                type="button"
                onClick={() => setLayoutType('grid')}
                title="Grid View"
                className={`p-2 ${
                  layoutType === 'grid'
                    ? 'bg-gray-100 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutType('list')}
                title="List View"
                className={`p-2 ${
                  layoutType === 'list'
                    ? 'bg-gray-100 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Event Count */}
        <div className="mb-6 text-sm text-gray-600">
          Showing {filteredEvents().length} event{filteredEvents().length !== 1 ? 's' : ''}
        </div>
        
        {/* Events List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents().length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            
            {view === 'upcoming' && (
              <>
                <h2 className="text-xl font-medium text-gray-900 mb-2">No upcoming events</h2>
                <p className="text-gray-600 mb-6">You don't have any upcoming events to attend.</p>
              </>
            )}
            
            {view === 'past' && (
              <>
                <h2 className="text-xl font-medium text-gray-900 mb-2">No past events</h2>
                <p className="text-gray-600 mb-6">You haven't attended any events yet.</p>
              </>
            )}
            
            {view === 'hosting' && (
              <>
                <h2 className="text-xl font-medium text-gray-900 mb-2">No events to host</h2>
                <p className="text-gray-600 mb-6">You're not currently hosting any events.</p>
              </>
            )}
            
            <Link 
              to="/events" 
              className="inline-flex items-center mr-4 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Browse Events
            </Link>
            
            <Link 
              to="/events/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </div>
        ) : (
          layoutType === 'grid' ? renderGridView() : renderListView()
        )}
      </div>
    </div>
  );
};

export default MyEventsPage;