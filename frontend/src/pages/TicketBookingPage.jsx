import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  Plus, 
  Minus, 
  Info, 
  ArrowLeft,
  ChevronRight,
  Lock,
  CreditCard,
  User,
  Mail,
  Phone,
  DollarSign
} from 'lucide-react';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';

const TicketBookingPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Select tickets, 2: User info, 3: Payment
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  
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
  
  // Format currency
  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };
  
  // Fetch event and ticket types
  useEffect(() => {
    const fetchEventAndTickets = async () => {
      try {
        setLoading(true);
        
        if (!eventId) {
          setError('Invalid event ID');
          setLoading(false);
          return;
        }
        
        // Fetch event details
        const eventResponse = await eventService.getEvent(eventId);
        setEvent(eventResponse.data);
        
        // Fetch ticket types
        setTicketsLoading(true);
        const ticketsResponse = await ticketService.getEventTicketTypes(eventId);
        console.log('Ticket types:', ticketsResponse);
        
        // Filter out sold out ticket types
        const availableTickets = (ticketsResponse.data || []).filter(ticket => 
          !ticket.available || ticket.available > 0
        );
        
        setTicketTypes(availableTickets);
        
        // Initialize selected tickets with zero quantity for each type
        const initialSelectedTickets = {};
        availableTickets.forEach(ticket => {
          initialSelectedTickets[ticket._id || ticket.id] = 0;
        });
        setSelectedTickets(initialSelectedTickets);
        
        setTicketsLoading(false);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details and tickets:', err);
        setError('Failed to load event information. Please try again later.');
        setLoading(false);
        setTicketsLoading(false);
      }
    };
    
    fetchEventAndTickets();
  }, [eventId]);
  
  // Handle ticket quantity changes
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
      
      // Calculate new total tickets
      const newSelectedTickets = { ...prevSelected, [ticketId]: newQty };
      const totalQuantity = Object.values(newSelectedTickets).reduce((sum, qty) => sum + qty, 0);
      
      // Check if max tickets per order exceeded (usually 10)
      if (totalQuantity > 10 && increment > 0) {
        alert('Maximum 10 tickets per order');
        return prevSelected;
      }
      
      return newSelectedTickets;
    });
  };
  
  // Calculate order summary
  const calculateOrderSummary = () => {
    const summary = {
      subtotal: 0,
      ticketCount: 0,
      items: [],
      fees: 0,
      total: 0
    };
    
    if (!ticketTypes || !ticketTypes.length) return summary;
    
    // Calculate subtotal and ticket count
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      if (quantity > 0) {
        const ticketType = ticketTypes.find(t => (t._id || t.id) === ticketId);
        if (ticketType) {
          const itemPrice = ticketType.price || 0;
          const itemTotal = itemPrice * quantity;
          summary.subtotal += itemTotal;
          summary.ticketCount += quantity;
          
          summary.items.push({
            id: ticketId,
            name: ticketType.name,
            price: itemPrice,
            quantity,
            total: itemTotal,
            currency: ticketType.currency || 'USD'
          });
        }
      }
    });
    
    // Calculate service fee (typically 5-10% of subtotal)
    summary.fees = summary.subtotal * 0.05;
    
    // Apply discount if coupon applied
    const discountAmount = couponApplied ? (summary.subtotal * (discount / 100)) : 0;
    
    // Calculate total
    summary.total = summary.subtotal + summary.fees - discountAmount;
    summary.discount = discountAmount;
    
    return summary;
  };
  
  // Handle user info changes
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submissions for each step
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
            quantity
          };
        });
      
      console.log('Prepared ticket selections:', ticketSelections);
      
      // Prepare booking data according to the API's expected format
      const bookingData = {
        ticketSelections,
        contactInformation: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone || ''
        }
      };
      
      console.log('Full booking data before submission:', JSON.stringify(bookingData, null, 2));
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
  
  // Handle coupon code application
  const handleApplyCoupon = () => {
    if (!couponCode) {
      alert('Please enter a coupon code');
      return;
    }
    
    // Normally would validate with API
    // Mock validation for demo purposes
    if (couponCode.toUpperCase() === 'SAVE20') {
      setCouponApplied(true);
      setDiscount(20);
      alert('Coupon applied: 20% off');
    } else {
      alert('Invalid coupon code');
    }
  };
  
  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const orderSummary = calculateOrderSummary();
      
      // Check if there are tickets to book
      if (orderSummary.ticketCount === 0) {
        alert('Please select at least one ticket');
        setStep(1);
        return;
      }
      
      // Prepare booking data
      const bookingData = {
        tickets: Object.entries(selectedTickets)
          .filter(([_, quantity]) => quantity > 0)
          .map(([ticketId, quantity]) => ({
            ticketType: ticketId,
            quantity
          })),
        customerInfo: userInfo,
        couponCode: couponApplied ? couponCode : undefined,
        discount: couponApplied ? discount : undefined
      };
      
      console.log('Submitting booking:', bookingData);
      
      // Call API to book tickets
      const response = await eventService.bookEventTickets(eventId, bookingData);
      console.log('Booking response:', response);
      
      // Redirect to confirmation page
      navigate(`/tickets/confirmation/${response.data?.id || 'success'}`);
      
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert('Failed to complete your booking. Please try again later.');
    }
  };
  
  // Back button functionality
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    } else {
      navigate(`/events/${eventId}`);
    }
  };
  
  const orderSummary = calculateOrderSummary();
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button 
            onClick={() => navigate('/events')} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Events
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
            Browse Events
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
              onClick={handleBack} 
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>{step === 1 ? 'Back to Event' : 'Back'}</span>
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              {step === 1 && 'Select Tickets'}
              {step === 2 && 'Your Information'}
              {step === 3 && 'Payment'}
            </h1>
          </div>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center text-sm font-medium">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'} mr-2`}>
                <Ticket className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">Tickets</span>
            </div>
            <div className={`w-12 h-0.5 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'} mr-2`}>
                <User className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">Information</span>
            </div>
            <div className={`w-12 h-0.5 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'} mr-2`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">Payment</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Event Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start">
                {event.coverImage?.url && (
                  <img 
                    src={event.coverImage.url} 
                    alt={event.name} 
                    className="w-16 h-16 object-cover rounded-lg mr-4 hidden sm:block"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h2>
                  <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600">
                    <div className="flex items-center mb-1 sm:mb-0">
                      <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                      {formatDate(event.startDateTime)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-500" />
                      {formatTime(event.startDateTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step 1: Ticket Selection */}
            {step === 1 && (
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Select Tickets</h3>
                  
                  {ticketsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading tickets...</p>
                    </div>
                  ) : ticketTypes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium">No tickets available</p>
                      <p className="text-gray-500 mt-1">There are currently no tickets available for this event.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ticketTypes.map(ticket => {
                        const ticketId = ticket._id || ticket.id;
                        const currentQty = selectedTickets[ticketId] || 0;
                        const isAvailable = !ticket.available || ticket.available > 0;
                        const remainingTickets = ticket.available || 'Unlimited';
                        
                        return (
                          <div 
                            key={ticketId} 
                            className={`border rounded-lg p-4 ${isAvailable ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-75'}`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="mb-3 md:mb-0">
                                <h4 className="font-bold text-gray-900">{ticket.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{ticket.description || 'Standard ticket'}</p>
                                
                                {isAvailable && (
                                  <div className="mt-1 text-sm">
                                    {typeof remainingTickets === 'number' && remainingTickets <= 10 ? (
                                      <span className="text-orange-600 font-medium">
                                        Only {remainingTickets} left
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">
                                        {typeof remainingTickets === 'number' ? `${remainingTickets} available` : 'Available'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between md:justify-end">
                                <div className="font-bold text-gray-900 md:text-right md:mr-4">
                                  {ticket.price === 0 ? 'Free' : formatCurrency(ticket.price, ticket.currency || 'USD')}
                                </div>
                                
                                <div className="flex items-center border border-gray-300 rounded-md">
                                  <button 
                                    type="button"
                                    onClick={() => handleTicketQuantityChange(ticketId, -1)}
                                    disabled={currentQty === 0 || !isAvailable}
                                    className={`p-2 ${
                                      currentQty === 0 || !isAvailable
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  
                                  <span className="w-10 text-center font-medium">
                                    {currentQty}
                                  </span>
                                  
                                  <button 
                                    type="button"
                                    onClick={() => handleTicketQuantityChange(ticketId, 1)}
                                    disabled={!isAvailable || (ticket.available && currentQty >= ticket.available)}
                                    className={`p-2 ${
                                      !isAvailable || (ticket.available && currentQty >= ticket.available)
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {currentQty > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                                <span className="font-medium text-gray-900">
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
                
                <div className="hidden sm:block">
                  <button
                    type="submit"
                    disabled={orderSummary.ticketCount === 0}
                    className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                      orderSummary.ticketCount === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Continue to Information
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </form>
            )}
            
            {/* Step 2: Attendee Information */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={userInfo.firstName}
                            onChange={handleUserInfoChange}
                            required
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={userInfo.lastName}
                            onChange={handleUserInfoChange}
                            required
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={userInfo.email}
                          onChange={handleUserInfoChange}
                          required
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Your tickets will be sent to this email address</p>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone (optional)
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={userInfo.phone}
                          onChange={handleUserInfoChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">For important updates about the event</p>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Payment
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </form>
            )}
            
            {/* Step 3: Payment */}
            {step === 3 && (
              <form onSubmit={handlePaymentSubmit}>
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4 flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-700">
                          This is a demo payment page. No actual payment will be processed.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="cardNumber"
                            placeholder="4242 4242 4242 4242"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            placeholder="MM/YY"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            id="cvv"
                            placeholder="123"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 mb-1">
                          Name on Card
                        </label>
                        <input
                          type="text"
                          id="nameOnCard"
                          placeholder="Jane Doe"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center">
                        <input
                          id="saveCard"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-900">
                          Save card for future purchases
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visa/visa-original.svg" alt="Visa" className="h-6" />
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" alt="Mastercard" className="h-6" />
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" alt="Apple Pay" className="h-6" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Complete Purchase
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              
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
                  
                  {/* Coupon Code Input */}
                  {!couponApplied && step >= 2 && (
                    <div className="mb-4">
                      <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Coupon Code
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          id="couponCode"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter code"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Price Breakdown */}
                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatCurrency(orderSummary.subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Fee</span>
                      <span>{formatCurrency(orderSummary.fees)}</span>
                    </div>
                    
                    {couponApplied && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({discount}%)</span>
                        <span>-{formatCurrency(orderSummary.discount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(orderSummary.total)}</span>
                    </div>
                  </div>
                  
                  {/* Mobile Submit Button */}
                  <div className="mt-6 sm:hidden">
                    {step === 1 && (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={orderSummary.ticketCount === 0}
                        className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                          orderSummary.ticketCount === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Continue to Information
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </button>
                    )}
                    
                    {step === 2 && (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Continue to Payment
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </button>
                    )}
                    
                    {step === 3 && (
                      <button
                        type="button"
                        onClick={handlePaymentSubmit}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Complete Purchase
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tickets selected</p>
                  <p className="text-sm text-gray-500 mt-2">Select tickets to continue</p>
                </div>
              )}
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <p className="text-xs text-gray-500">
                    All sales are final. Please review your order before completing your purchase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketBookingPage;
