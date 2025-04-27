import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Tag, 
  Share2, 
  MessageSquare, 
  ChevronDown,
  ChevronUp,
  CalendarPlus,
  Ticket,
  Heart,
  BookOpen,
  Check,
  X
} from 'lucide-react';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';
import Sidebar from '../components/common/Navbar'; // Import the Sidebar component

const EventDetailPage = ({ user, onLogout }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userResponse, setUserResponse] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [showAllDescription, setShowAllDescription] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [organizer, setOrganizer] = useState(null);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
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

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        // Check if we have a valid eventId
        if (!eventId) {
          setError('Invalid event ID. Please check the URL and try again.');
          setLoading(false);
          return;
        }
        
        // Fetch event details from API
        const response = await eventService.getEvent(eventId);
        const eventData = response.data;
        setEvent(eventData);
        setUserResponse(eventData.userResponse);
        setOrganizer(eventData.createdBy);
        
        // Fetch ticket types if available
        try {
          setTicketsLoading(true);
          const ticketsResponse = await ticketService.getEventTicketTypes(eventId);
          setTicketTypes(ticketsResponse.data || []);
          setTicketsLoading(false);
        } catch (ticketError) {
          console.error('Error fetching ticket types:', ticketError);
          setTicketsLoading(false);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);

  const handleResponseClick = async (status) => {
    try {
      // Check if we have a valid eventId
      if (!eventId) {
        console.error('Cannot respond: Invalid event ID');
        alert('Cannot respond to this event. Invalid event ID.');
        return;
      }
      
      // Call API to update response
      const response = await eventService.respondToEvent(eventId, status);
      
      // Update local state to show immediate feedback
      setUserResponse(status);
      
      // Update attendance count optimistically
      if (event.attendeeCounts) {
        const updatedCounts = { ...event.attendeeCounts };
        
        // Decrement previous status if exists
        if (userResponse) {
          const prevCount = getAttendeeCount(updatedCounts, userResponse);
          if (typeof updatedCounts[userResponse] === 'object') {
            updatedCounts[userResponse] = { 
              ...updatedCounts[userResponse], 
              count: Math.max(0, prevCount - 1) 
            };
          } else {
            updatedCounts[userResponse] = Math.max(0, prevCount - 1);
          }
        }
        
        // Increment new status
        const newCount = getAttendeeCount(updatedCounts, status);
        if (typeof updatedCounts[status] === 'object') {
          updatedCounts[status] = { 
            ...updatedCounts[status], 
            count: newCount + 1 
          };
        } else {
          updatedCounts[status] = newCount + 1;
        }
        
        setEvent({
          ...event,
          attendeeCounts: updatedCounts
        });
      }
    } catch (error) {
      console.error('Failed to update response:', error);
      alert('Failed to update your response. Please try again later.');
    }
  };
  
  const handleBuyTickets = () => {
    navigate(`/tickets/book/${eventId}`);
  };
  
  const handleAddToCalendar = async () => {
    try {
      // Check if we have a valid eventId
      if (!eventId) {
        console.error('Cannot add to calendar: Invalid event ID');
        alert('Cannot add this event to calendar. Invalid event ID.');
        return;
      }
      
      const response = await eventService.addToCalendar(eventId);
      
      // Show success message
      alert('Event added to your calendar');
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      alert('Failed to add event to calendar. Please try again later.');
    }
  };
  
  // Get going count safely
  const goingCount = event ? getAttendeeCount(event.attendeeCounts, 'going') : 0;
  const maybeCount = event ? getAttendeeCount(event.attendeeCounts, 'maybe') : 0;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="z-20 relative">
        <Sidebar user={user} onLogout={onLogout} />
      </div>
    
      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-orange-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-t-4 border-orange-500 border-solid rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading event details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500">{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : !event ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p>Event not found</p>
              <button 
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                onClick={() => navigate('/events')}
              >
                Back to Events
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Event Header/Hero */}
            <div className="relative bg-orange-900 h-80">
              {event.coverImage?.url ? (
                <img 
                  src={event.coverImage.url} 
                  alt={event.name}
                  className="w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="bg-gradient-to-r from-orange-600 to-orange-900 w-full h-full"></div>
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="max-w-5xl mx-auto">
                  <div className="inline-block mb-4 bg-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                    {event.category}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.name}</h1>
                  
                  <div className="flex flex-wrap gap-4 text-sm md:text-base">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>{formatDate(event.startDateTime)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>{formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>
                        {event.virtual 
                          ? "Virtual Event" 
                          : `${event.location?.name || 'TBA'}${event.location?.city ? `, ${event.location.city}` : ''}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      <span>{goingCount} attending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Event Details */}
                <div className="lg:col-span-2">
                  {/* Action Buttons (Mobile) */}
                  <div className="lg:hidden flex flex-col space-y-3 mb-6">
                    <button 
                      onClick={handleBuyTickets}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg w-full flex justify-center items-center transition"
                    >
                      <Ticket className="mr-2 h-5 w-5" />
                      Get Tickets
                    </button>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleResponseClick('going')}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg border ${
                          userResponse === 'going' 
                            ? 'bg-green-100 border-green-600 text-green-700' 
                            : 'bg-white hover:bg-gray-100 border-gray-300'
                        } transition`}
                      >
                        <Check className={`h-5 w-5 ${userResponse === 'going' ? 'text-green-600' : 'text-gray-500'}`} />
                        <span className="text-sm mt-1">Going</span>
                      </button>
                      
                      <button 
                        onClick={() => handleResponseClick('maybe')}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg border ${
                          userResponse === 'maybe' 
                            ? 'bg-orange-100 border-orange-600 text-orange-700' 
                            : 'bg-white hover:bg-gray-100 border-gray-300'
                        } transition`}
                      >
                        <Calendar className={`h-5 w-5 ${userResponse === 'maybe' ? 'text-orange-600' : 'text-gray-500'}`} />
                        <span className="text-sm mt-1">Maybe</span>
                      </button>
                      
                      <button 
                        onClick={() => handleResponseClick('declined')}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg border ${
                          userResponse === 'declined' 
                            ? 'bg-red-100 border-red-600 text-red-700' 
                            : 'bg-white hover:bg-gray-100 border-gray-300'
                        } transition`}
                      >
                        <X className={`h-5 w-5 ${userResponse === 'declined' ? 'text-red-600' : 'text-gray-500'}`} />
                        <span className="text-sm mt-1">Can't Go</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-orange-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
                    <div className={showAllDescription ? '' : 'relative'}>
                      <div className={showAllDescription ? '' : 'max-h-48 overflow-hidden'}>
                        {(event.description || 'No description provided').split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-4 text-gray-700">{paragraph}</p>
                        ))}
                      </div>
                      
                      {!showAllDescription && event.description && event.description.length > 300 && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
                      )}
                    </div>
                    
                    {event.description && event.description.length > 300 && (
                      <button 
                        onClick={() => setShowAllDescription(!showAllDescription)}
                        className="mt-2 text-orange-600 font-medium flex items-center"
                      >
                        {showAllDescription ? (
                          <>
                            Show Less <ChevronUp className="ml-1 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Read More <ChevronDown className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Ticket Types */}
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-orange-100">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Tickets</h2>
                      {ticketTypes.length > 0 && (
                        <button 
                          onClick={handleBuyTickets}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                          Get Tickets
                        </button>
                      )}
                    </div>
                    
                    {ticketsLoading ? (
                      <div className="text-center py-6">
                        <div className="w-10 h-10 border-t-4 border-orange-500 border-solid rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading ticket information...</p>
                      </div>
                    ) : ticketTypes.length === 0 ? (
                      <p className="text-gray-600 italic">No tickets are currently available for this event.</p>
                    ) : (
                      <div className="space-y-4">
                        {ticketTypes.map(ticket => (
                          <div key={ticket._id || ticket.id} className="border border-orange-200 rounded-lg p-4 hover:border-orange-300 transition bg-orange-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-lg">{ticket.name}</h3>
                                <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg">
                                  {ticket.price === 0 ? 'Free' : `${ticket.currency || 'USD'} ${ticket.price}`}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {ticket.available > 0 ? `${ticket.available} available` : 'Sold out'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-4 pt-4 border-t border-orange-200">
                          <button 
                            onClick={handleBuyTickets}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg w-full transition"
                          >
                            Get Tickets
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-orange-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Tags</h2>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map(tag => (
                          <div key={tag} className="bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-full text-sm flex items-center transition">
                            <Tag className="w-3 h-3 mr-1 text-orange-500" />
                            {tag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Location Map */}
                  {!event.virtual && event.location && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-orange-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
                      <div className="bg-orange-100 h-64 rounded-lg mb-4 flex items-center justify-center">
                        <p className="text-gray-600">Map would be displayed here</p>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{event.location.name || 'Location TBA'}</h3>
                        <p className="text-gray-700">
                          {event.location.address || ''}<br />
                          {event.location.city ? `${event.location.city}, ` : ''}
                          {event.location.state ? `${event.location.state} ` : ''}
                          {event.location.country || ''}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Comments/Discussion Section */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Discussion</h2>
                    
                    <div className="flex items-start space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">
                          {user?.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <textarea 
                          className="w-full border border-orange-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Ask a question or leave a comment..." 
                          rows={3}
                        ></textarea>
                        <div className="mt-2 flex justify-end">
                          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <p className="text-gray-500 text-center italic">No comments yet. Be the first to start the discussion!</p>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Sidebar */}
                <div className="lg:col-span-1">
                  {/* Action Buttons (Desktop) */}
                  <div className="hidden lg:block">
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-orange-100">
                      <button 
                        onClick={handleBuyTickets}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg w-full mb-4 flex justify-center items-center transition"
                        disabled={ticketTypes.length === 0}
                      >
                        <Ticket className="mr-2 h-5 w-5" />
                        Get Tickets
                      </button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handleResponseClick('going')}
                          className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border ${
                            userResponse === 'going' 
                              ? 'bg-green-100 border-green-600 text-green-700' 
                              : 'bg-white hover:bg-gray-100 border-gray-300'
                          } transition`}
                        >
                          <Check className={`h-5 w-5 ${userResponse === 'going' ? 'text-green-600' : 'text-gray-500'}`} />
                          <span className="text-sm mt-1">Going</span>
                        </button>
                        
                        <button 
                          onClick={() => handleResponseClick('maybe')}
                          className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border ${
                            userResponse === 'maybe' 
                              ? 'bg-orange-100 border-orange-600 text-orange-700' 
                              : 'bg-white hover:bg-gray-100 border-gray-300'
                          } transition`}
                        >
                          <Calendar className={`h-5 w-5 ${userResponse === 'maybe' ? 'text-orange-600' : 'text-gray-500'}`} />
                          <span className="text-sm mt-1">Maybe</span>
                        </button>
                        
                        <button 
                          onClick={() => handleResponseClick('declined')}
                          className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border ${
                            userResponse === 'declined' 
                              ? 'bg-red-100 border-red-600 text-red-700' 
                              : 'bg-white hover:bg-gray-100 border-gray-300'
                          } transition`}
                        >
                          <X className={`h-5 w-5 ${userResponse === 'declined' ? 'text-red-600' : 'text-gray-500'}`} />
                          <span className="text-sm mt-1">Can't Go</span>
                        </button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-orange-200 flex space-x-2">
                        <button 
                          onClick={handleAddToCalendar}
                          className="flex-1 flex justify-center items-center py-2 px-4 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium transition"
                        >
                          <CalendarPlus className="mr-2 h-4 w-4 text-orange-600" />
                          Add to Calendar
                        </button>
                        
                        <button className="flex-1 flex justify-center items-center py-2 px-4 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium transition">
                          <Share2 className="mr-2 h-4 w-4 text-orange-600" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date and Time Info */}
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-orange-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Date and Time</h2>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">Starts</p>
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                          <span>{formatDate(event.startDateTime)}</span>
                        </div>
                        <div className="flex items-center text-gray-700 mt-1">
                          <Clock className="w-4 h-4 mr-2 text-orange-500" />
                          <span>{formatTime(event.startDateTime)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium">Ends</p>
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                          <span>{formatDate(event.endDateTime)}</span>
                        </div>
                        <div className="flex items-center text-gray-700 mt-1">
                          <Clock className="w-4 h-4 mr-2 text-orange-500" />
                          <span>{formatTime(event.endDateTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleAddToCalendar}
                      className="mt-4 w-full bg-white border border-orange-300 hover:bg-orange-50 py-2 px-4 rounded-lg text-sm font-medium flex justify-center items-center transition"
                    >
                      <CalendarPlus className="mr-2 h-4 w-4 text-orange-600" />
                      Add to Calendar
                    </button>
                  </div>
                  
                  {/* Organizer Info */}
                  {organizer && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-orange-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Organizer</h2>
                      
                      <div className="flex items-center">
                        {organizer.profileImage ? (
                          <img 
                            src={organizer.profileImage} 
                            alt={`${organizer.firstName} ${organizer.lastName}`}
                            className="w-12 h-12 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-orange-200 rounded-full mr-3 flex items-center justify-center text-orange-600 font-medium">
                            {organizer.firstName?.charAt(0) || ''}
                            {organizer.lastName?.charAt(0) || ''}
                          </div>
                        )}
                        
                        <div>
                          <h3 className="font-bold">
                            {organizer.firstName} {organizer.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{organizer.headline || 'Event Organizer'}</p>
                        </div>
                      </div>
                      
                      <button className="mt-4 w-full bg-white border border-orange-300 hover:bg-orange-50 py-2 px-4 rounded-lg text-sm font-medium transition">
                        View Profile
                      </button>
                    </div>
                  )}
                  
                  {/* Attendees Preview */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-100">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Who's Going</h2>
                      <button 
                        className="text-orange-600 text-sm font-medium"
                        onClick={() => navigate(`/events/${eventId}/attendees`)}
                      >
                        See All
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap -mx-1">
                     {[...Array(Math.min(8, goingCount))].map((_, i) => (
                        <div key={i} className="p-1">
                          <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 font-medium">
                            U
                          </div>
                        </div>
                      ))}
                      {goingCount > 8 && (
                        <div className="p-1">
                          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-medium">
                            +{goingCount - 8}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-600">
                      <p>{goingCount} people going</p>
                      {maybeCount > 0 && (
                        <p className="mt-1">{maybeCount} people interested</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;
