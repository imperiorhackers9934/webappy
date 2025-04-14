import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Filter, ArrowUpDown } from 'lucide-react';
import eventService from '../services/eventService'; // Import the eventService
import { Link } from 'react-router-dom';
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
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
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
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.name || "Untitled Event"}</h3>
        
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
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, goingCount))].map((_, i) => (
                <div key={`avatar-${i}-${event._id || event.id}`} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">
              {goingCount} attending
            </span>
          </div>
          <Link to={`/events/${event._id || event.id}`} className="text-white">
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
    View
  </button>
</Link>
        </div>
      </div>
    </div>
  );
};

const EventListingPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([
    "All",
    "Business",
    "Technology",
    "Social",
    "Education",
    "Entertainment",
    "Health",
    "Other"
  ]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Define API filters based on selected filter
        const apiFilters = {};
        
        // Add time-based filters
        if (filter === 'upcoming') {
          apiFilters.filter = 'upcoming';
        } else if (filter === 'past') {
          apiFilters.filter = 'past';
        }
        
        // Add category filter if selected (and not "All")
        if (categoryFilter && categoryFilter !== 'All') {
          apiFilters.category = categoryFilter.toLowerCase();
        }
        
        // Add search query if present
        if (searchQuery) {
          apiFilters.search = searchQuery;
        }
        
        console.log('Fetching events with filters:', apiFilters);
        
        // Call the event service to get events
        const response = await eventService.getEvents(apiFilters);
        console.log('API Response:', response);
        
        // Update categories if available from API
        if (response.categories && response.categories.length > 0) {
          // Extract category names from the API response
          const extractedCategories = ['All', ...response.categories.map(cat => 
            typeof cat === 'string' ? cat : (cat._id || 'Other')
          )];
          setCategories(extractedCategories);
        }
        
        // Get events from response
        const eventsData = response.events || response.data || [];
        console.log('Events data:', eventsData);
        
        setEvents(eventsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [filter, categoryFilter, searchQuery]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    // The useEffect will trigger a new API call
  };

  // Filter events client-side if search is changed without submitting
  const filteredEvents = events.filter(event => {
    const eventName = event.name || '';
    const matchesSearch = searchQuery === '' || 
      eventName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Hero Section */}
      <div className="bg-blue-700 py-16 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Find Your Next Event</h1>
          <p className="text-xl text-blue-100 mb-8">Discover events that match your interests</p>
          
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center bg-white p-2 rounded-lg shadow-lg">
              <div className="flex items-center flex-1 w-full">
                <Search className="h-5 w-5 text-gray-400 ml-2" />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="flex-1 p-2 ml-2 focus:outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="mt-3 sm:mt-0 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-500 transition duration-300 ease-in-out"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <button 
              className={`px-4 py-2 rounded-full ${filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              All Events
            </button>
            <button 
              className={`px-4 py-2 rounded-full ${filter === 'past' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setFilter('past')}
            >
              Past
            </button>
          </div>
          
          <div className="flex space-x-3">
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Category</option>
                {categories.map((category, index) => (
                  <option key={`category-${index}`} value={category}>{category}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            
            <button className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-4 py-2">
              <ArrowUpDown className="h-4 w-4 text-gray-600" />
              <span>Sort</span>
            </button>
          </div>
        </div>
        
        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
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
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">No events found matching your criteria.</p>
            {(searchQuery || categoryFilter) && (
              <button 
                className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard 
                key={event._id || event.id || `event-${Math.random()}`} 
                event={event} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventListingPage;