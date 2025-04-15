import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Ticket, 
  CreditCard, 
  Calendar, 
  Clock, 
  MapPin, 
  Info
} from 'lucide-react';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';
// Add this function somewhere in your component for testing

import axios from 'axios';

const testDirectBooking = async () => {
  try {
    // Get authentication token
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    // Create test booking data
    const testBookingData = {
      ticketSelections: [
        {
          ticketTypeId: "67eff60c6f43d944c091a169",  // Use your actual ticket ID
          quantity: 1
        }
      ],
      contactInformation: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "1234567890"
      }
    };
    
    console.log('Testing direct booking with data:', JSON.stringify(testBookingData, null, 2));
    console.log('Using token:', token.substring(0, 10) + '...');
    
    // Make direct API call
    const eventId = "67eff5ec6f43d944c091a157";  // Use your actual event ID
    const response = await axios.post(
      `https://new-backend-w86d.onrender.com/api/bookings/events/${eventId}/book`,
      testBookingData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Direct booking test succeeded:', response.data);
    return response.data;
  } catch (error) {
    console.error('Direct booking test failed:', error);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      
      // Display validation errors in detail
      if (error.response.data && error.response.data.errors) {
        console.error('Validation errors in detail:');
        error.response.data.errors.forEach((err, index) => {
          console.error(`Error ${index + 1}:`, JSON.stringify(err, null, 2));
        });
      }
    }
    
    return null;
  }
};


const TicketPurchasePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
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
  
  useEffect(() => {
    // Combined fetch function to load both event and tickets
    const fetchData = async () => {
      try {
        if (!eventId) {
          setError('Invalid event ID');
          setLoading(false);
          return;
        }
        
        // Fetch event details
        const eventResponse = await eventService.getEvent(eventId);
        setEvent(eventResponse.data);
        
        // Fetch ticket types
        const ticketsResponse = await ticketService.getEventTicketTypes(eventId);
        
        // Log the ticketsResponse for debugging
        console.log('Ticket types response:', ticketsResponse);
        
        if (ticketsResponse && ticketsResponse.data) {
          console.log('Setting ticket types:', ticketsResponse.data);
          setTicketTypes(ticketsResponse.data);
          
          // Initialize selected tickets
          const initialSelectedTickets = {};
          ticketsResponse.data.forEach(ticket => {
            const ticketId = ticket._id || ticket.id;
            initialSelectedTickets[ticketId] = 0;
          });
          setSelectedTickets(initialSelectedTickets);
        } else {
          console.warn('No ticket data available in response');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load event or ticket information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);
  
  // Handle ticket quantity adjustment
  const handleTicketQuantityChange = (ticketId, increment) => {
    setSelectedTickets(prevSelected => {
      const currentQty = prevSelected[ticketId] || 0;
      const ticketType = ticketTypes.find(t => (t._id || t.id) === ticketId);
      
      // Prevent negative quantities or exceeding available tickets
      let newQty = currentQty + increment;
      
      if (newQty < 0) {
        newQty = 0;
      }
      
      if (ticketType && ticketType.available && newQty > ticketType.available) {
        newQty = ticketType.available;
      }
      
      return {
        ...prevSelected,
        [ticketId]: newQty
      };
    });
  };
  
  // Handle customer info changes
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Calculate order summary
  const calculateOrderSummary = () => {
    const summary = {
      subtotal: 0,
      ticketCount: 0,
      items: []
    };
    
    // Check that ticketTypes is initialized
    if (!ticketTypes || !ticketTypes.length) return summary;
    
    // Calculate subtotal and ticket count
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      if (quantity > 0) {
        const ticketType = ticketTypes.find(t => (t._id || t.id) === ticketId);
        if (ticketType) {
          const itemTotal = ticketType.price * quantity;
          summary.subtotal += itemTotal;
          summary.ticketCount += quantity;
          
          summary.items.push({
            id: ticketId,
            name: ticketType.name,
            price: ticketType.price,
            quantity,
            total: itemTotal,
            currency: ticketType.currency || 'USD'
          });
        }
      }
    });
    
    return summary;
  };
  
  // Format currency
  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };
  
  // Handle booking submission
  // Corrected handleSubmitBooking function for TicketPurchasePage.jsx

// Handle booking submission
// Updated handleSubmitBooking function with enhanced debugging
// Add this to your TicketPurchasePage.jsx file

const handleSubmitBooking = async (e) => {
  e.preventDefault();
  
  try {
    setSubmitting(true);
    
    // Validate form
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }
    
    // Check if any tickets are selected
    const summary = calculateOrderSummary();
    if (summary.ticketCount === 0) {
      setError('Please select at least one ticket');
      setSubmitting(false);
      return;
    }
    
    // Transform the selected tickets into the format expected by the API
    const ticketSelections = Object.entries(selectedTickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketId, quantity]) => {
        console.log(`Selected ticket: ${ticketId} with quantity: ${quantity}`);
        return {
          ticketTypeId: ticketId,
          quantity: parseInt(quantity, 10)  // Ensure quantity is a number
        };
      });
    
    console.log('Prepared ticket selections:', ticketSelections);
    
    // Check if this is a free order
    const isFreeOrder = summary.subtotal === 0;
    
    // Prepare booking data according to the API's expected format
    const bookingData = {
      ticketSelections,
      contactInformation: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone || ''
      },
      // Add payment method explicitly based on pricing
      paymentMethod: isFreeOrder ? 'free' : 'pending'
    };
    
    console.log('Booking data before submission:', JSON.stringify(bookingData, null, 2));
    console.log('Event ID for booking:', eventId);
    
    // Call API to book tickets
    const response = await ticketService.bookEventTickets(eventId, bookingData);
    
    console.log('Booking response received:', response);
    
    // Handle response and redirect
    if (response && response.id) {
      navigate(`/tickets/confirmation/${response.id}`);
    } else if (response && response.booking && response.booking.id) {
      navigate(`/tickets/confirmation/${response.booking.id}`);
    } else if (response && response.success) {
      navigate(`/tickets/confirmation/success`);
    } else {
      // Generic success if we don't have a specific ID
      navigate(`/tickets/confirmation/success`);
    }
    
  } catch (err) {
    console.error('Error submitting booking:', err);
    
    // Enhanced error display
    let errorMessage = 'Failed to complete your booking. Please try again later.';
    
    if (err.response && err.response.data && err.response.data.error) {
      errorMessage = `Booking error: ${err.response.data.error}`;
      console.error('Detailed error from server:', err.response.data);
    } else if (err.message) {
      errorMessage = `Booking error: ${err.message}`;
    }
    
    setError(errorMessage);
    setSubmitting(false);
  }
};
  
  const orderSummary = calculateOrderSummary();
  
  // Debug logs for ticket data
  console.log("Current ticketTypes:", ticketTypes);
  console.log("Is ticketTypes an array?", Array.isArray(ticketTypes));
  console.log("ticketTypes length:", ticketTypes.length);
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket information...</p>
        </div>
      </div>
    );
  }
  
  if (error && !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </button>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
          <button 
            onClick={() => navigate('/events')} 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(`/events/${eventId}`)} 
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back to Event</span>
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">Get Tickets</h1>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ticket Selection & Customer Info */}
          <div className="lg:col-span-2">
            {/* Event Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{event.name}</h2>
              <div className="flex flex-col md:flex-row md:items-center text-gray-600 mb-2 space-y-2 md:space-y-0 md:space-x-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 flex-shrink-0 text-gray-500" />
                  <span>{formatDate(event.startDateTime)}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 flex-shrink-0 text-gray-500" />
                  <span>{formatTime(event.startDateTime)}</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 flex-shrink-0 text-gray-500" />
                  <span>
                    {event.virtual 
                      ? "Virtual Event" 
                      : `${event.location?.name || ''}${event.location?.city ? `, ${event.location.city}` : ''}`}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Ticket Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Tickets</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              {!ticketTypes || ticketTypes.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tickets are currently available for this event.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketTypes.map(ticket => {
                    const ticketId = ticket._id || ticket.id;
                    const isAvailable = ticket.available > 0;
                    const currentQty = selectedTickets[ticketId] || 0;
                    
                    return (
                      <div 
                        key={ticketId} 
                        className={`border rounded-lg p-4 ${isAvailable ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-75'}`}
                      >
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{ticket.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                            
                            {!isAvailable && (
                              <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                Sold Out
                              </span>
                            )}
                            
                            {isAvailable && ticket.available <= 5 && (
                              <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                Only {ticket.available} left
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <div className="font-bold text-lg">
                              {ticket.price === 0 ? 'Free' : formatCurrency(ticket.price, ticket.currency || 'USD')}
                            </div>
                            
                            <div className="flex items-center mt-2">
                              <button 
                                onClick={() => handleTicketQuantityChange(ticketId, -1)}
                                disabled={currentQty === 0 || !isAvailable}
                                className={`p-1 rounded-full ${
                                  currentQty === 0 || !isAvailable
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                <Minus className="w-5 h-5" />
                              </button>
                              
                              <span className="w-10 text-center font-medium">
                                {currentQty}
                              </span>
                              
                              <button 
                                onClick={() => handleTicketQuantityChange(ticketId, 1)}
                                disabled={!isAvailable || (ticket.available && currentQty >= ticket.available)}
                                className={`p-1 rounded-full ${
                                  !isAvailable || (ticket.available && currentQty >= ticket.available)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {currentQty > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-right">
                            <span className="font-medium">
                              {formatCurrency(ticket.price * currentQty, ticket.currency || 'USD')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Customer Information Form */}
            {orderSummary.ticketCount > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Information</h2>
                
                <form onSubmit={handleSubmitBooking} id="checkout-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={customerInfo.firstName}
                        onChange={handleCustomerInfoChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={customerInfo.lastName}
                        onChange={handleCustomerInfoChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={customerInfo.email}
                        onChange={handleCustomerInfoChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={handleCustomerInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-start mb-6">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        type="checkbox"
                        required
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="terms" className="font-medium text-gray-700">
                        I agree to the terms and conditions
                      </label>
                      <p className="text-gray-500">
                        By purchasing tickets, you agree to the event's refund policy and terms of service.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 lg:hidden">
                    <button
                      type="submit"
                      disabled={submitting || orderSummary.ticketCount === 0}
                      className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                        submitting || orderSummary.ticketCount === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          Complete Purchase ({formatCurrency(orderSummary.subtotal)})
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          // Add a button in your component to test this:
/*
<button 
  type="button"
  onClick={testDirectBooking} 
  className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded"
>
  Test Direct Booking
</button>
*/
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              {orderSummary.ticketCount > 0 ? (
                <>
                  <div className="space-y-4 mb-6">
                    {orderSummary.items.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} × {formatCurrency(item.price, item.currency)}</p>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(item.total, item.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(orderSummary.subtotal)}</span>
                    </div>
                  </div>
                  
                  <div className="hidden lg:block">
                    <button
                      type="submit"
                      form="checkout-form"
                      disabled={submitting}
                      className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                        submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Complete Purchase
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tickets selected</p>
                  <p className="text-sm text-gray-500 mt-2">Select tickets to continue</p>
                </div>
              )}
              
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Ticket Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Tickets are non-refundable</li>
                        <li>You can transfer tickets to other users</li>
                        <li>E-tickets will be sent to your email</li>
                        <li>Please bring a photo ID for check-in</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPurchasePage;