import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  CalendarPlus, 
  Ticket, 
  ChevronRight,
  Mail,
  Share2
} from 'lucide-react';
import eventService from '../services/eventService';

const PaymentSuccessPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // Format currency
  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };
  
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        
        if (!bookingId || bookingId === 'success') {
          // Handle the case where we don't have a real booking ID (demo mode)
          setLoading(false);
          return;
        }
        
        // Fetch booking details
        const bookingResponse = await eventService.getBooking(bookingId);
        setBooking(bookingResponse.data);
        
        // Fetch related event details if not included in booking
        if (bookingResponse.data && bookingResponse.data.event) {
          if (typeof bookingResponse.data.event === 'object') {
            setEvent(bookingResponse.data.event);
          } else {
            // If only event ID is provided, fetch the event details
            const eventResponse = await eventService.getEvent(bookingResponse.data.event);
            setEvent(eventResponse.data);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking information. Please check your email for confirmation details.');
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId]);
  
  // Function to handle downloading tickets
  const handleDownloadTickets = async () => {
    try {
      if (!booking || !booking.id) {
        console.error('No booking ID available for download');
        return;
      }
      
      // For each ticket, download the PDF
      const tickets = booking.tickets || [];
      if (tickets.length === 0) {
        alert('No tickets available for download');
        return;
      }
      
      // If there's just one ticket, download it directly
      if (tickets.length === 1) {
        const ticket = tickets[0];
        const ticketId = ticket.id || ticket._id;
        const blob = await eventService.downloadTicketPdf(ticketId);
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link and click it to download
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${ticketId}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For multiple tickets, inform the user
        alert('Your tickets will download individually');
        
        // Download each ticket
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const ticketId = ticket.id || ticket._id;
          
          setTimeout(async () => {
            const blob = await eventService.downloadTicketPdf(ticketId);
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link and click it to download
            const a = document.createElement('a');
            a.href = url;
            a.download = `ticket-${ticketId}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, i * 1000); // Stagger downloads to avoid overwhelming the browser
        }
      }
    } catch (err) {
      console.error('Error downloading tickets:', err);
      alert('Failed to download tickets. Please try again later or check your email.');
    }
  };
  
  // Function to handle adding event to calendar
  const handleAddToCalendar = async () => {
    try {
      if (!event || !event._id) {
        console.error('No event ID available for calendar');
        return;
      }
      
      const response = await eventService.addToCalendar(event._id);
      console.log('Calendar response:', response);
      
      alert('Event added to your calendar');
    } catch (err) {
      console.error('Error adding to calendar:', err);
      alert('Failed to add event to calendar. Please try again later.');
    }
  };
  
  // Calculate total cost
  const calculateTotal = () => {
    if (!booking) return 0;
    
    const tickets = booking.tickets || [];
    return tickets.reduce((total, ticket) => {
      const price = ticket.ticketType?.price || 0;
      const quantity = ticket.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };
  
  // Demo data for when we don't have a real booking ID
  const demoEvent = {
    name: 'Sample Event Confirmation',
    startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    location: {
      name: 'Demo Venue',
      city: 'Sample City'
    },
    coverImage: { url: '/api/placeholder/800/400' }
  };
  
  const demoBooking = {
    id: 'demo-booking',
    createdAt: new Date(),
    status: 'confirmed',
    customerInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    },
    tickets: [
      {
        id: 'demo-ticket-1',
        ticketType: {
          name: 'General Admission',
          price: 29.99
        },
        quantity: 2
      }
    ],
    total: 59.98,
    currency: 'USD'
  };
  
  // Use demo data if in demo mode
  const displayEvent = event || (bookingId === 'success' ? demoEvent : null);
  const displayBooking = booking || (bookingId === 'success' ? demoBooking : null);
  const totalCost = displayBooking ? (displayBooking.total || calculateTotal()) : 0;
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Success Banner */}
      <div className="bg-green-100 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Payment successful!</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Confirmation Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Complete!</h1>
          <p className="text-lg text-gray-600">
            Your tickets have been confirmed and emailed to {displayBooking?.customerInfo?.email || 'your email address'}
          </p>
        </div>
        
        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          {/* Event Info */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start">
              {displayEvent?.coverImage?.url && (
                <img 
                  src={displayEvent.coverImage.url} 
                  alt={displayEvent.name}
                  className="w-24 h-24 object-cover rounded-lg mr-4 hidden sm:block"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{displayEvent?.name || 'Event'}</h2>
                <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600">
                  <div className="flex items-center mb-1 sm:mb-0">
                    <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                    {formatDate(displayEvent?.startDateTime)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-500" />
                    {formatTime(displayEvent?.startDateTime)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                    {displayEvent?.virtual 
                      ? "Virtual Event" 
                      : `${displayEvent?.location?.name || ''}${displayEvent?.location?.city ? `, ${displayEvent.location.city}` : ''}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tickets Summary */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Summary</h3>
            
            <div className="space-y-4">
              {(displayBooking?.tickets || []).map((ticket, index) => (
                <div key={ticket.id || ticket._id || index} className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{ticket.ticketType?.name || 'Ticket'}</h4>
                    <p className="text-sm text-gray-600">Quantity: {ticket.quantity || 1}</p>
                  </div>
                  <div className="font-medium text-gray-900">
                    {formatCurrency((ticket.ticketType?.price || 0) * (ticket.quantity || 1), displayBooking.currency)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>{formatCurrency(totalCost, displayBooking?.currency)}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 bg-gray-50">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleDownloadTickets}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Tickets
              </button>
              
              <button 
                onClick={handleAddToCalendar}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add to Calendar
              </button>
              
              <button 
                onClick={() => {
                  try {
                    navigator.share({
                      title: displayEvent?.name,
                      text: `I'm going to ${displayEvent?.name}!`,
                      url: window.location.origin + `/events/${displayEvent?._id || displayEvent?.id}`
                    });
                  } catch (err) {
                    console.error('Share failed:', err);
                    alert('Sharing is not supported in your browser');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </button>
            </div>
          </div>
        </div>
        
        {/* Order Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Order Details</h4>
              <p className="text-gray-900 mb-1">Order Number: {displayBooking?.id || displayBooking?._id || 'N/A'}</p>
              <p className="text-gray-900 mb-1">
                Order Date: {displayBooking?.createdAt 
                  ? new Date(displayBooking.createdAt).toLocaleDateString() 
                  : new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-900">
                Payment Method: Credit Card
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Customer Information</h4>
              <p className="text-gray-900 mb-1">
                {displayBooking?.customerInfo?.firstName} {displayBooking?.customerInfo?.lastName}
              </p>
              <p className="text-gray-900 mb-1">{displayBooking?.customerInfo?.email}</p>
              <p className="text-gray-900">{displayBooking?.customerInfo?.phone || ''}</p>
            </div>
          </div>
        </div>
        
        {/* What's Next */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h3>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">Check Your Email</h4>
                <p className="mt-1 text-sm text-gray-600">
                  We've sent your tickets and order confirmation to your email address.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">Save Your Tickets</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Download your tickets now or access them later from your account.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">Add to Calendar</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Don't forget to add this event to your calendar so you don't miss it.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 space-x-4 flex">
            <Link 
              to="/events" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse More Events
            </Link>
            
            <Link 
              to="/tickets" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View My Tickets
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;