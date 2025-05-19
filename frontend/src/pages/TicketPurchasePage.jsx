import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  XCircle,
  Ticket,
  Calendar,
  ShoppingBag
} from 'lucide-react';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';

// Use dynamic import for Cashfree component to avoid loading it unnecessarily
const CashfreePayment = React.lazy(() => import('../components/payment/CashfreeButton'));

const TicketPurchasePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('select'); // select, payment, confirmation
  const [customerInfo, setCustomerInfo] = useState({ email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cashfree');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Fetch event and ticket types on component mount
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);
        
        // Fetch available ticket types
        const ticketsData = await ticketService.getEventTicketTypes(eventId);
        
        // Filter out inactive or sold out tickets
        const availableTickets = ticketsData?.data?.filter(
          ticket => ticket.isActive && (ticket.quantity > ticket.quantitySold || ticket.quantity === -1)
        ) || [];
        
        setTicketTypes(availableTickets);
        
        // Initialize selected tickets array
        setSelectedTickets(
          availableTickets.map(ticket => ({
            ticketTypeId: ticket.id,
            quantity: 0,
            name: ticket.name,
            price: ticket.price,
            maxQuantity: ticket.maxPerUser || 10
          }))
        );
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  // Calculate total amount whenever selected tickets change
  useEffect(() => {
    let total = 0;
    
    selectedTickets.forEach(ticket => {
      total += ticket.price * ticket.quantity;
    });
    
    setTotalAmount(total);
  }, [selectedTickets]);
  
  // Update ticket quantity
  const handleQuantityChange = (index, quantity) => {
    const updatedTickets = [...selectedTickets];
    updatedTickets[index].quantity = quantity;
    setSelectedTickets(updatedTickets);
  };
  
  // Handle customer info change
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };
  
  // Proceed to payment step
  const proceedToPayment = () => {
    // Validate ticket selection
    const hasSelectedTickets = selectedTickets.some(ticket => ticket.quantity > 0);
    
    if (!hasSelectedTickets) {
      setError('Please select at least one ticket');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    // Move to payment step
    setCheckoutStep('payment');
  };
  
  // Go back to previous step
  const goBack = () => {
    if (checkoutStep === 'payment') {
      setCheckoutStep('select');
    } else if (checkoutStep === 'confirmation') {
      setCheckoutStep('payment');
    } else {
      navigate(`/events/${eventId}`);
    }
  };
  
  // Create booking and proceed to payment
  const createBooking = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);
      
      // Filter only selected tickets
      const ticketSelections = selectedTickets
        .filter(ticket => ticket.quantity > 0)
        .map(ticket => ({
          ticketTypeId: ticket.ticketTypeId,
          quantity: ticket.quantity
        }));
      
      // Create booking through ticket service
      const bookingResponse = await ticketService.bookEventTickets(eventId, {
        ticketSelections,
        paymentMethod,
        contactInformation: customerInfo
      });
      
      if (bookingResponse && bookingResponse.booking) {
        // Store booking ID for reference
        setBookingId(bookingResponse.booking.id);
        return bookingResponse.booking;
      } else {
        throw new Error('Booking creation failed');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
      setPaymentProcessing(false);
      return null;
    }
  };
  
  // Handle successful payment
  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    setPaymentProcessing(false);
    setCheckoutStep('confirmation');
    
    // Redirect to confirmation page
    if (bookingId) {
      navigate(`/tickets/confirmation/${bookingId}`);
    }
  };
  
  // Handle payment failure
  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setError('Payment could not be completed. Please try again.');
    setPaymentProcessing(false);
  };
  
  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setPaymentProcessing(false);
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && !event) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/events')}
          className="mt-4 inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Browse Events
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={goBack}
          className="inline-flex items-center text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {checkoutStep === 'select' ? 'Back to Event' : 'Back'}
        </button>
        
        <h1 className="text-2xl font-bold mt-2">
          {checkoutStep === 'select' ? 'Select Tickets' : 
           checkoutStep === 'payment' ? 'Complete Payment' : 
           'Payment Confirmation'}
        </h1>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      {/* Event Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          {event?.coverImage?.url && (
            <div className="md:w-1/3 mb-4 md:mb-0 md:pr-4">
              <img 
                src={event.coverImage.url} 
                alt={event.name} 
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
          )}
          
          <div className="md:w-2/3">
            <h2 className="text-xl font-semibold">{event?.name}</h2>
            <div className="flex items-center text-gray-600 mt-2">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(event?.startDateTime)}</span>
            </div>
            <div className="flex items-start mt-2">
              <div className="flex-shrink-0 mt-1">
                <Ticket className="w-4 h-4 text-gray-600 mr-2" />
              </div>
              <div>
                <p className="text-gray-600">
                  {ticketTypes.length === 0 
                    ? 'No tickets available' 
                    : `${ticketTypes.length} ticket type${ticketTypes.length !== 1 ? 's' : ''} available`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ticket Selection Step */}
      {checkoutStep === 'select' && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Select Tickets</h3>
            
            {ticketTypes.length === 0 ? (
              <p className="text-gray-600">No tickets available for this event.</p>
            ) : (
              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <div key={ticket.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{ticket.name}</div>
                        <div className="text-sm text-gray-600">{ticket.description}</div>
                        <div className="mt-1 font-semibold">{formatCurrency(ticket.price)}</div>
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuantityChange(index, Math.max(0, selectedTickets[index].quantity - 1))}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded-l-md"
                          disabled={selectedTickets[index].quantity === 0}
                        >
                          -
                        </button>
                        <span className="bg-gray-100 px-4 py-1">{selectedTickets[index].quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(index, Math.min(selectedTickets[index].maxQuantity, selectedTickets[index].quantity + 1))}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded-r-md"
                          disabled={selectedTickets[index].quantity >= selectedTickets[index].maxQuantity}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {selectedTickets[index].quantity > 0 && (
                      <div className="mt-2 text-sm text-right">
                        Subtotal: {formatCurrency(selectedTickets[index].price * selectedTickets[index].quantity)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Your Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={handleInfoChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-gray-700 mb-1">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={handleInfoChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4">
              {selectedTickets
                .filter(ticket => ticket.quantity > 0)
                .map((ticket, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      {ticket.name} x {ticket.quantity}
                    </div>
                    <div>{formatCurrency(ticket.price * ticket.quantity)}</div>
                  </div>
                ))
              }
            </div>
            
            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold">
              <div>Total</div>
              <div>{formatCurrency(totalAmount)}</div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={proceedToPayment}
              disabled={!selectedTickets.some(ticket => ticket.quantity > 0) || !customerInfo.email || !customerInfo.phone}
              className={`inline-flex items-center px-6 py-3 rounded-md text-white ${
                !selectedTickets.some(ticket => ticket.quantity > 0) || !customerInfo.email || !customerInfo.phone
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Proceed to Payment
            </button>
          </div>
        </>
      )}
      
      {/* Payment Step */}
      {checkoutStep === 'payment' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
          
          <div className="space-y-4 mb-6">
            <label className="flex items-center p-4 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="cashfree"
                checked={paymentMethod === 'cashfree'}
                onChange={() => setPaymentMethod('cashfree')}
                className="mr-2"
              />
              <CreditCard className="w-5 h-5 text-orange-500 mr-2" />
              <span>Cashfree (Credit/Debit Cards, UPI, Netbanking)</span>
            </label>
          </div>
          
          {paymentMethod === 'cashfree' && (
            <Suspense fallback={<div>Loading payment gateway...</div>}>
              <CashfreePayment
                amount={totalAmount}
                bookingId={bookingId || 'pending'}
                eventName={event?.name || 'Event Tickets'}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                onCancel={handlePaymentCancel}
              />
            </Suspense>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              By proceeding with payment, you agree to our <a href="/terms" className="text-orange-600 hover:underline">Terms and Conditions</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketPurchasePage;