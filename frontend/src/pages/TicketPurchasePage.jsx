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
  User,  
  Mail,  
  Phone,  
  CreditCard,  
  CheckCircle,
  XCircle
} from 'lucide-react';  
import eventService from '../services/eventService';  
import ticketService from '../services/ticketService';  
import { useToast } from '../components/common/Toast';  
import { useAuth } from '../context/AuthContext';

const TicketBookingPage = () => {  
  const { eventId } = useParams();  
  const navigate = useNavigate();  
  const { user } = useAuth();  
  const toast = useToast();  
    
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
  const [step, setStep] = useState(1); // 1: Select tickets, 2: User info, 3: Confirmation  
  const [couponCode, setCouponCode] = useState('');  
  const [couponApplied, setCouponApplied] = useState(false);  
  const [discount, setDiscount] = useState(0);  
  const [bookingError, setBookingError] = useState(null);  
  const [paymentMethod, setPaymentMethod] = useState('cashfree_sdk');  
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingId, setBookingId] = useState(null);
    
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
  const formatCurrency = (amount, currencyCode = 'INR') => {  
    return new Intl.NumberFormat('en-IN', {  
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
        setEvent(eventResponse);  
          
        // Fetch ticket types  
        setTicketsLoading(true);  
        const ticketsResponse = await ticketService.getEventTicketTypes(eventId);  
        console.log('Ticket types:', ticketsResponse);  
          
        // Don't filter out paid tickets anymore - show all available tickets  
        const availableTickets = (ticketsResponse.data || []).filter(ticket =>   
          (!ticket.available || ticket.available > 0) && ticket.isOnSale !== false  
        );  
          
        setTicketTypes(availableTickets);  
          
        // Initialize selected tickets with zero quantity for each type  
        const initialSelectedTickets = {};  
        availableTickets.forEach(ticket => {  
          initialSelectedTickets[ticket._id || ticket.id] = 0;  
        });  
        setSelectedTickets(initialSelectedTickets);  
          
        // Pre-fill user info if available  
        if (user) {  
          setUserInfo({  
            firstName: user.firstName || '',  
            lastName: user.lastName || '',  
            email: user.email || '',  
            phone: user.phone || ''  
          });  
        }  
          
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
  }, [eventId, user]);  
    
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
        toast.warning({ description: 'Maximum 10 tickets per order' });  
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
      total: 0,  
      currency: 'INR'  
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
            
          // Set the currency from the first ticket type that has one  
          if (ticketType.currency) {  
            summary.currency = ticketType.currency;  
          }  
            
          summary.items.push({  
            id: ticketId,  
            name: ticketType.name,  
            price: itemPrice,  
            quantity,  
            total: itemTotal,  
            currency: ticketType.currency || summary.currency  
          });  
        }  
      }  
    });  
      
    // Add platform fees (3% of subtotal or minimum 20)  
    if (summary.subtotal > 0) {  
      summary.fees = Math.max(summary.subtotal * 0.03, 20);  
      summary.fees = Math.round(summary.fees * 100) / 100; // Round to 2 decimal places  
    }  
      
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
    
  // Handle coupon code application  
  const handleApplyCoupon = () => {  
    if (!couponCode) {  
      toast.error({ description: 'Please enter a coupon code' });  
      return;  
    }  
      
    // Here you would normally call an API to validate the coupon  
    // For now, let's simulate a successful coupon application  
    setCouponApplied(true);  
    setDiscount(10); // 10% discount  
    toast.success({ description: 'Coupon applied successfully!' });  
  };  

  // Handle payment method selection  
  const handlePaymentMethodChange = (method) => {  
    setPaymentMethod(method);  
  };  
    
  // Handle form submissions for each step  
  const handleSubmit = (e) => {  
    if (e) e.preventDefault();  
    setBookingError(null);  
      
    if (step === 1) {  
      const orderSummary = calculateOrderSummary();  
      if (orderSummary.ticketCount === 0) {  
        toast.error({ description: 'Please select at least one ticket' });  
        return;  
      }  
      setStep(2);  
      window.scrollTo(0, 0);  
    } else if (step === 2) {  
      // Validate user info  
      if (!userInfo.firstName || !userInfo.lastName || !userInfo.email) {  
        toast.error({ description: 'Please fill in all required fields' });  
        return;  
      }  
        
      // Validate email format  
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  
      if (!emailRegex.test(userInfo.email)) {  
        toast.error({ description: 'Please enter a valid email address' });  
        return;  
      }  
        
      setStep(3);  
      window.scrollTo(0, 0);  
    }  
  };  
    
  // Handle completing the booking  
  const handleCompleteBooking = async (e) => {  
    e.preventDefault();  
    setBookingError(null);  
    setProcessingPayment(true);  
      
    try {  
      const orderSummary = calculateOrderSummary();  
        
      // Check if there are tickets to book  
      if (orderSummary.ticketCount === 0) {  
        toast.error({ description: 'Please select at least one ticket' });  
        setStep(1);  
        setProcessingPayment(false);  
        return;  
      }  
        
      // Calculate the total amount (for validation)  
      const totalAmount = orderSummary.total || 0;  
        
      // Prepare ticket selections in the correct format
      const ticketSelections = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketId, quantity]) => ({
          ticketTypeId: ticketId,
          quantity: parseInt(quantity, 10)
        }));
          
      // Create booking first
      const bookingData = {
        ticketSelections,
        contactInformation: {
          email: userInfo.email,
          phone: userInfo.phone || ''
        },
        paymentMethod: totalAmount > 0 ? paymentMethod : 'free'
      };
        
      console.log('Creating booking:', bookingData);
      
      // Call API to book tickets  
      const response = await ticketService.bookEventTickets(eventId, bookingData);
      console.log('Booking response:', response);
      
      // Store the booking ID
      const newBookingId = response.booking?.id || response._id;
      setBookingId(newBookingId);
        
      // Handle different payment methods  
      if (totalAmount > 0) {
        if (paymentMethod === 'cashfree_sdk') {
          // Redirect to payment page
          navigate(`/tickets/book/${eventId}`, { 
            state: { 
              bookingId: newBookingId,
              amount: totalAmount,
              eventName: event.name
            }
          });
          return;
        } else if (paymentMethod === 'phonepe') {
          // Check if we have a PhonePe redirect URL  
          if (response.payment && response.payment.redirectUrl) {  
            console.log('Redirecting to PhonePe payment:', response.payment.redirectUrl);  
              
            // Store booking ID in localStorage for retrieval after payment  
            localStorage.setItem('pendingBookingId', newBookingId);  
              
            // Redirect to PhonePe  
            window.location.href = response.payment.redirectUrl;  
            return;  
          } else {  
            console.error('No redirect URL provided for PhonePe payment');  
            throw new Error('Payment initialization failed. Please try again.');  
          }
        }
      } else {  
        // Free booking, no payment needed  
        console.log('Free booking completed');  
          
        // Redirect to confirmation page  
        navigate(`/tickets/confirmation/${newBookingId}`);  
        return;  
      }  

    } catch (err) {  
      console.error('Error submitting booking:', err);  
      setBookingError(
        err.response?.data?.error ||   
        err.response?.data?.message ||   
        err.message ||   
        'Failed to complete your booking. Please try again later.'  
      );  
      setProcessingPayment(false);  
      // Stay on the confirmation page to show the error  
      window.scrollTo(0, 0);  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">  
        <div className="text-center">  
          <div className="w-16 h-16 border-t-4 border-orange-500 border-solid rounded-full animate-spin mx-auto"></div>  
          <p className="mt-4 text-gray-600">Loading event details...</p>  
        </div>  
      </div>  
    );  
  }  
    
  if (error) {  
    return (  
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">  
        <div className="text-center">  
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">  
            <strong className="font-bold">Error: </strong>  
            <span className="block sm:inline">{error}</span>  
          </div>  
          <button   
            onClick={() => navigate('/events')}   
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"  
          >  
            Browse Events  
          </button>  
        </div>  
      </div>  
    );  
  }  
    
  if (!event) {  
    return (  
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">  
        <div className="text-center">  
          <p className="text-gray-600">Event not found</p>  
          <button   
            onClick={() => navigate('/events')}   
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"  
          >  
            Browse Events  
          </button>  
        </div>  
      </div>  
    );  
  }  
    
  return (  
    <div className="bg-orange-50 min-h-screen pb-12">  
      {/* Header */}  
      <div className="bg-white shadow-sm">  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">  
          <div className="flex items-center">  
            <button   
              onClick={handleBack}   
              className="text-orange-600 hover:text-orange-900 flex items-center"  
            >  
              <ArrowLeft className="w-5 h-5 mr-2" />  
              <span>{step === 1 ? 'Back to Event' : 'Back'}</span>  
            </button>  
            <h1 className="ml-4 text-xl font-semibold text-gray-900">  
              {step === 1 && 'Select Tickets'}  
              {step === 2 && 'Your Information'}  
              {step === 3 && 'Confirmation'}  
            </h1>  
          </div>  
        </div>  
      </div>  
        
      {/* Progress Steps */}  
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">  
        <div className="flex items-center justify-center">  
          <div className="flex items-center text-sm font-medium">  
            <div className={`flex items-center ${step >= 1 ? 'text-orange-600' : 'text-gray-500'}`}>  
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'} mr-2`}>  
                <Ticket className="w-4 h-4" />  
              </div>  
              <span className="hidden sm:inline">Tickets</span>  
            </div>  
            <div className={`w-12 h-0.5 mx-2 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>  
              
            <div className={`flex items-center ${step >= 2 ? 'text-orange-600' : 'text-gray-500'}`}>  
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'} mr-2`}>  
                <User className="w-4 h-4" />  
              </div>  
              <span className="hidden sm:inline">Information</span>  
            </div>  
            <div className={`w-12 h-0.5 mx-2 ${step >= 3 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>  
              
            <div className={`flex items-center ${step >= 3 ? 'text-orange-600' : 'text-gray-500'}`}>  
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'} mr-2`}>  
                <CreditCard className="w-4 h-4" />  
              </div>  
              <span className="hidden sm:inline">Confirmation</span>  
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
            <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">  
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
                      <Calendar className="w-4 h-4 mr-1 text-orange-500" />  
                      {formatDate(event.startDateTime)}  
                    </div>  
                    <div className="flex items-center">  
                      <Clock className="w-4 h-4 mr-1 text-orange-500" />  
                      {formatTime(event.startDateTime)}  
                    </div>  
                  </div>  
                </div>  
              </div>  
            </div>  
              
            {/* Display booking error if any */}  
            {bookingError && (  
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">  
                <div className="flex">  
                  <div className="py-1">  
                    <XCircle className="h-6 w-6 text-red-500 mr-4" />  
                  </div>  
                  <div>  
                    <p className="font-medium">Booking failed</p>  
                    <p className="text-sm">{bookingError}</p>  
                  </div>  
                </div>  
              </div>  
            )}  
              
            {/* Step 1: Ticket Selection */}  
            {step === 1 && (  
              <form onSubmit={handleSubmit}>  
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">  
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Select Tickets</h3>  
                    
                  {ticketsLoading ? (  
                    <div className="text-center py-8">  
                      <div className="w-12 h-12 border-t-4 border-orange-500 border-solid rounded-full animate-spin mx-auto"></div>  
                      <p className="mt-4 text-gray-600">Loading tickets...</p>  
                    </div>  
                  ) : ticketTypes.length === 0 ? (  
                    <div className="text-center py-8 bg-orange-50 rounded-lg">  
                      <Ticket className="w-12 h-12 text-orange-400 mx-auto mb-3" />  
                      <p className="text-gray-700 font-medium">No tickets available</p>  
                      <p className="text-gray-500 mt-1">There are currently no tickets available for this event.</p>  
                    </div>  
                  ) : (  
                    <div className="space-y-4">  
                      {ticketTypes.map(ticket => {  
                        const ticketId = ticket._id || ticket.id;  
                        const currentQty = selectedTickets[ticketId] || 0;  
                        const isAvailable = (!ticket.available || ticket.available > 0) && (ticket.isOnSale !== false);  
                        const remainingTickets = ticket.available || 'Unlimited';  
                        const isPaid = ticket.price > 0;  
                          
                        return (  
                          <div   
                            key={ticketId}   
                            className={`border rounded-lg p-4 ${isAvailable ? 'border-orange-200 hover:border-orange-300' : 'border-gray-200 bg-gray-50 opacity-75'}`}  
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
                                  {isPaid ? formatCurrency(ticket.price, ticket.currency || 'INR') : 'Free'}  
                                </div>  
                                  
                                <div className="flex items-center border border-orange-300 rounded-md">  
                                  <button   
                                    type="button"  
                                    onClick={() => handleTicketQuantityChange(ticketId, -1)}  
                                    disabled={currentQty === 0 || !isAvailable}  
                                    className={`p-2 ${  
                                      currentQty === 0 || !isAvailable  
                                        ? 'text-gray-300 cursor-not-allowed'   
                                        : 'text-orange-600 hover:bg-orange-100'  
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
                                        : 'text-orange-600 hover:bg-orange-100'  
                                    }`}  
                                  >  
                                    <Plus className="w-4 h-4" />  
                                  </button>  
                                </div>  
                              </div>  
                            </div>  
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
                        : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500'  
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
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">  
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>  
                    
                  <div className="space-y-4">  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">  
                      <div>  
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">  
                          First Name <span className="text-orange-500">*</span>  
                        </label>  
                        <div className="mt-1 relative rounded-md shadow-sm">  
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">  
                            <User className="h-5 w-5 text-orange-400" />  
                          </div>  
                          <input  
                       type="text"  
                       id="firstName"  
                       name="firstName"  
                       value={userInfo.firstName}  
                       onChange={handleUserInfoChange}  
                       required  
                       className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
                     />  
                   </div>  
                 </div>  
                   
                 <div>  
                   <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">  
                     Last Name <span className="text-orange-500">*</span>  
                   </label>  
                   <div className="mt-1 relative rounded-md shadow-sm">  
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">  
                       <User className="h-5 w-5 text-orange-400" />  
                     </div>  
                     <input  
                       type="text"  
                       id="lastName"  
                       name="lastName"  
                       value={userInfo.lastName}  
                       onChange={handleUserInfoChange}  
                       required  
                       className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
                     />  
                   </div>  
                 </div>  
               </div>  
                 
               <div>  
                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">  
                   Email <span className="text-orange-500">*</span>  
                 </label>  
                 <div className="mt-1 relative rounded-md shadow-sm">  
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">  
                     <Mail className="h-5 w-5 text-orange-400" />  
                   </div>  
                   <input  
                     type="email"  
                     id="email"  
                     name="email"  
                     value={userInfo.email}  
                     onChange={handleUserInfoChange}  
                     required  
                     className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
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
                     <Phone className="h-5 w-5 text-orange-400" />  
                   </div>  
                   <input  
                     type="tel"  
                     id="phone"  
                     name="phone"  
                     value={userInfo.phone}  
                     onChange={handleUserInfoChange}  
                     className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
                   />  
                 </div>  
                 <p className="mt-1 text-xs text-gray-500">For important updates about the event</p>  
               </div>  
             </div>  
           </div>  
             
           <div className="hidden sm:block">  
             <button  
               type="submit"  
               className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"  
             >  
               Continue to Confirmation  
               <ChevronRight className="ml-2 h-5 w-5" />  
             </button>  
           </div>  
         </form>  
       )}  
        
       {/* Step 3: Confirmation */}  
       {step === 3 && (  
         <form onSubmit={handleCompleteBooking}>  
           <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">  
             <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Your Details</h3>  
               
             <div className="space-y-6">  
               {/* Information Summary */}  
               <div className="border-b border-orange-100 pb-4">  
                 <h4 className="font-medium text-gray-900 mb-2">Attendee Information</h4>  
                 <div className="grid grid-cols-2 gap-4 text-sm">  
                   <div>  
                     <p className="text-gray-500">Name</p>  
                     <p className="font-medium">{userInfo.firstName} {userInfo.lastName}</p>  
                   </div>  
                   <div>  
                     <p className="text-gray-500">Email</p>  
                     <p className="font-medium">{userInfo.email}</p>  
                   </div>  
                   {userInfo.phone && (  
                     <div>  
                       <p className="text-gray-500">Phone</p>  
                       <p className="font-medium">{userInfo.phone}</p>  
                     </div>  
                   )}  
                 </div>  
               </div>  
                 
               {/* Ticket Summary */}  
               <div>  
                 <h4 className="font-medium text-gray-900 mb-2">Ticket Summary</h4>  
                 <div className="space-y-2">  
                   {orderSummary.items.map(item => (  
                     <div key={item.id} className="flex justify-between text-sm">  
                       <span>{item.name} × {item.quantity}</span>  
                       <span className="font-medium">  
                         {item.price > 0   
                           ? formatCurrency(item.price * item.quantity, item.currency)  
                           : 'Free'}  
                       </span>  
                     </div>  
                   ))}  
                 </div>  
               </div>  
                 
               {/* Payment Method Selection (only for paid tickets) */}  
               {orderSummary.total > 0 && (  
                 <div className="border-t border-orange-100 pt-4">  
                   <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>  
                     
                   <div className="space-y-3">  
                     <div className="flex items-center">  
                       <input  
                         id="payment-cashfree"  
                         name="paymentMethod"  
                         type="radio"  
                         checked={paymentMethod === 'cashfree_sdk'}  
                         onChange={() => handlePaymentMethodChange('cashfree_sdk')}  
                         className="h-4 w-4 text-orange-600 focus:ring-orange-500"  
                       />  
                       <label htmlFor="payment-cashfree" className="ml-3 block text-sm font-medium text-gray-700 flex items-center">  
                         <span className="mr-2">Cashfree</span>
                       </label>  
                     </div>  
                       
                     <div className="flex items-center">  
                       <input  
                         id="payment-phonepe"  
                         name="paymentMethod"  
                         type="radio"  
                         checked={paymentMethod === 'phonepe'}  
                         onChange={() => handlePaymentMethodChange('phonepe')}  
                         className="h-4 w-4 text-orange-600 focus:ring-orange-500"  
                       />  
                       <label htmlFor="payment-phonepe" className="ml-3 block text-sm font-medium text-gray-700 flex items-center">  
                         <span className="mr-2">PhonePe</span>  
                       </label>  
                     </div>  
                       
                     {/* Add other payment methods like this: */}  
                     <div className="flex items-center opacity-50 cursor-not-allowed">  
                       <input  
                         id="payment-card"  
                         name="paymentMethod"  
                         type="radio"  
                         disabled  
                         className="h-4 w-4 text-gray-400 focus:ring-orange-500"  
                       />  
                       <label htmlFor="payment-card" className="ml-3 block text-sm font-medium text-gray-500">  
                         Credit/Debit Card (Coming Soon)  
                       </label>  
                     </div>  
                       
                     <div className="flex items-center opacity-50 cursor-not-allowed">  
                       <input  
                         id="payment-upi"  
                         name="paymentMethod"  
                         type="radio"  
                         disabled  
                         className="h-4 w-4 text-gray-400 focus:ring-orange-500"  
                       />  
                       <label htmlFor="payment-upi" className="ml-3 block text-sm font-medium text-gray-500">  
                         UPI (Coming Soon)  
                       </label>  
                     </div>  
                   </div>  
                 </div>  
               )}  
                 
               {/* Disclaimer */}  
               <div className="bg-orange-50 rounded-lg p-4 flex items-start border border-orange-200">  
                 <Info className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />  
                 <div>  
                   <p className="text-sm text-orange-700">  
                     By completing this booking, you agree to our Terms of Service, Privacy Policy, and Refund Policy.   
                     {orderSummary.total > 0   
                       ? " Please review your order details before proceeding to payment."   
                       : " Your free tickets will be sent to your email."}  
                   </p>  
                 </div>  
               </div>  
             </div>  
           </div>  
             
           <div className="hidden sm:block">  
             <button  
               type="submit"  
               disabled={processingPayment}  
               className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 ${processingPayment ? 'opacity-75 cursor-not-allowed' : ''}`}  
             >  
               {processingPayment ? (  
                 <>  
                   <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>  
                   Processing...  
                 </>  
               ) : (  
                 <>  
                   {orderSummary.total > 0 ? 'Proceed to Payment' : 'Complete Booking'}  
                   <ChevronRight className="ml-2 h-5 w-5" />  
                 </>  
               )}  
             </button>  
           </div>  
         </form>  
       )}  
     </div>  
       
     {/* Right Column - Order Summary */}  
     <div className="lg:col-span-1">  
       <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 sticky top-6">  
         <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>  
           
         {orderSummary.ticketCount > 0 ? (  
           <>  
             <div className="space-y-4 mb-6">  
               {orderSummary.items.map(item => (  
                 <div key={item.id} className="flex justify-between">  
                   <div>  
                     <p className="font-medium">{item.name}</p>  
                     <p className="text-sm text-gray-600">{item.quantity} ticket{item.quantity > 1 ? 's' : ''}</p>  
                   </div>  
                   <div className="font-medium">  
                     {item.price > 0   
                       ? formatCurrency(item.price * item.quantity, item.currency)  
                       : 'Free'}  
                   </div>  
                 </div>  
               ))}  
             </div>  
               
             {/* Coupon Code Input (Step 1 Only) */}  
             {step === 1 && orderSummary.subtotal > 0 && (  
               <div className="flex space-x-2 mb-4">  
                 <input  
                   type="text"  
                   value={couponCode}  
                   onChange={(e) => setCouponCode(e.target.value)}  
                   placeholder="Coupon code"  
                   className="flex-1 focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-orange-300 rounded-md"  
                 />  
                 <button  
                   type="button"  
                   onClick={handleApplyCoupon}  
                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"  
                 >  
                   Apply  
                 </button>  
               </div>  
             )}  
               
             {/* Applied Coupon (All Steps) */}  
             {couponApplied && (  
               <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-4 flex items-center">  
                 <CheckCircle className="h-5 w-5 text-green-500 mr-2" />  
                 <span className="text-sm text-green-800">Coupon applied: {discount}% off</span>  
               </div>  
             )}  
               
             {/* Price Breakdown */}  
             <div className="space-y-2 border-t border-orange-200 pt-4">  
               <div className="flex justify-between text-sm">  
                 <span className="text-gray-600">Subtotal</span>  
                 <span>  
                   {orderSummary.subtotal > 0   
                     ? formatCurrency(orderSummary.subtotal, orderSummary.currency)  
                     : 'Free'}  
                 </span>  
               </div>  
                 
               {orderSummary.fees > 0 && (  
                 <div className="flex justify-between text-sm">  
                   <span className="text-gray-600">Service fees</span>  
                   <span>{formatCurrency(orderSummary.fees, orderSummary.currency)}</span>  
                 </div>  
               )}  
                 
               {couponApplied && orderSummary.discount > 0 && (  
                 <div className="flex justify-between text-sm text-green-600">  
                   <span>Discount</span>  
                   <span>-{formatCurrency(orderSummary.discount, orderSummary.currency)}</span>  
                 </div>  
               )}  
                 
               <div className="flex justify-between font-bold text-lg pt-2 border-t border-orange-200 mt-2">  
                 <span>Total</span>  
                 <span>  
                   {orderSummary.total > 0   
                     ? formatCurrency(orderSummary.total, orderSummary.currency)  
                     : 'Free'}  
                 </span>  
               </div>  
             </div>  
               
             {/* Mobile Submit Button */}  
             <div className="mt-6 block sm:hidden">  
               {step === 1 && (  
                 <button  
                   type="button"  
                   onClick={handleSubmit}  
                   disabled={orderSummary.ticketCount === 0}  
                   className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${  
                     orderSummary.ticketCount === 0  
                       ? 'bg-gray-400 cursor-not-allowed'  
                       : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500'  
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
                   className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"  
                 >  
                   Continue to Confirmation  
                   <ChevronRight className="ml-2 h-5 w-5" />  
                 </button>  
               )}  
                 
               {step === 3 && (  
                 <button  
                   type="button"  
                   onClick={handleCompleteBooking}  
                   disabled={processingPayment}  
                   className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 ${processingPayment ? 'opacity-75 cursor-not-allowed' : ''}`}  
                 >  
                   {processingPayment ? (  
                     <>  
                       <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>  
                       Processing...  
                     </>  
                   ) : (  
                     <>  
                       {orderSummary.total > 0 ? 'Proceed to Payment' : 'Complete Booking'}  
                       <ChevronRight className="ml-2 h-5 w-5" />  
                     </>  
                   )}  
                 </button>  
               )}  
             </div>  
           </>  
         ) : (  
           <div className="text-center py-6">  
             <Ticket className="w-12 h-12 text-orange-400 mx-auto mb-3" />  
             <p className="text-gray-600">No tickets selected</p>  
             <p className="text-sm text-gray-500 mt-2">Select tickets to continue</p>  
           </div>  
         )}  
           
         <div className="mt-6 border-t border-orange-200 pt-4">  
           <div className="flex items-start">  
             <Info className="h-5 w-5 text-orange-400 mr-2 mt-0.5 flex-shrink-0" />  
             <p className="text-xs text-gray-500">  
               {orderSummary.total > 0   
                 ? "All purchases are final. Please review your order details before completing your purchase."  
                 : "Tickets are free but registration is required. Please review your information before completing your booking."}  
             </p>  
           </div>  
         </div>  
           
         <div className="mt-6 space-y-2">  
           {[  
             { label: "Privacy Policy", href: "/privacypolicy" },  
             { label: "Refund Policy", href: "/refundpolicy" },  
             { label: "Terms of Service", href: "/termsandconditions" },  
           ].map((item) => (  
             <a  
               key={item.label}  
               href={item.href}  
               className="block text-xs text-gray-600 hover:text-orange-500 underline"  
               target="_blank"  
               rel="noopener noreferrer"  
             >  
               {item.label}  
             </a>  
           ))}
         </div>
       </div>  
     </div>  
   </div>  
 </div>  
</div>  
);  
};

export default TicketBookingPage;
