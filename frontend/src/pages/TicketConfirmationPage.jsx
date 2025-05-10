import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Ticket, 
  Plus, 
  Minus, 
  Info, 
  ArrowLeft,
  ChevronRight,
  User,
  FileText,
  Shield,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const TicketConfirmationPage = () => {
  // State variables
  const [step, setStep] = useState(1); // 1: Select tickets, 2: User info, 3: Confirmation
  const [selectedTickets, setSelectedTickets] = useState({
    'free-ticket': 0
  });
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Policy modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [activePolicyType, setActivePolicyType] = useState('');
  
  // Mock event data
  const event = {
    id: 'meetkats-event',
    name: 'Meetkats',
    startDateTime: '2023-05-30T19:30:00',
    coverImage: {
      url: '/meetkats-logo.png'
    }
  };
  
  // Mock ticket types
  const ticketTypes = [
    {
      id: 'free-ticket',
      name: 'Free',
      description: 'Basic',
      price: 0,
      available: 2497,
      currency: 'USD'
    }
  ];
  
  // Handle ticket quantity changes
  const handleTicketQuantityChange = (ticketId, increment) => {
    setSelectedTickets(prevSelected => {
      const currentQty = prevSelected[ticketId] || 0;
      const ticketType = ticketTypes.find(t => t.id === ticketId);
      
      // Prevent negative quantities or exceeding available tickets
      let newQty = currentQty + increment;
      
      if (newQty < 0) {
        newQty = 0;
      }
      
      if (ticketType && ticketType.available && newQty > ticketType.available) {
        newQty = ticketType.available;
      }
      
      // Check if max tickets per order exceeded
      const newSelectedTickets = { ...prevSelected, [ticketId]: newQty };
      const totalQuantity = Object.values(newSelectedTickets).reduce((sum, qty) => sum + qty, 0);
      
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
    
    // Calculate subtotal and ticket count
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      if (quantity > 0) {
        const ticketType = ticketTypes.find(t => t.id === ticketId);
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
    
    // Calculate total (no fees for free tickets)
    summary.total = summary.subtotal + summary.fees;
    
    return summary;
  };
  
  // Handle form submissions for each step
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (step === 1) {
      // Validate if tickets are selected before proceeding
      const orderSummary = calculateOrderSummary();
      if (orderSummary.ticketCount === 0) {
        alert('Please select at least one ticket');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate user info before proceeding
      if (!userInfo.firstName || !userInfo.lastName || !userInfo.email) {
        alert('Please fill all required fields');
        return;
      }
      setStep(3);
    }
    
    window.scrollTo(0, 0);
  };
  
  // Back button functionality
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    } else {
      // Navigate back to event page (in a real app this would use router)
      console.log('Navigate to event page');
    }
  };
  
  // Handle user info changes
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle policy click
  const openPolicyModal = (policyType) => {
    setActivePolicyType(policyType);
    setShowPolicyModal(true);
  };
  
  // Close policy modal
  const closePolicyModal = () => {
    setShowPolicyModal(false);
  };
  
  // Get policy content based on type
  const getPolicyContent = () => {
    switch (activePolicyType) {
      case 'terms':
        return {
          title: 'Terms and Conditions',
          content: 'These are the terms and conditions for using our ticketing service. By purchasing tickets, you agree to these terms.',
          icon: <FileText className="w-6 h-6 text-gray-600" />
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: 'This privacy policy explains how we collect, use, and protect your personal information when you use our ticketing service.',
          icon: <Shield className="w-6 h-6 text-gray-600" />
        };
      case 'refund':
        return {
          title: 'Refund Policy',
          content: 'Our refund policy outlines the conditions under which you may be eligible for a refund for purchased tickets.',
          icon: <RefreshCw className="w-6 h-6 text-gray-600" />
        };
      default:
        return { title: '', content: '', icon: null };
    }
  };
  
  const orderSummary = calculateOrderSummary();
  
  return (
    <div className="bg-orange-50 min-h-screen">
      {/* Header */}
      <header className="bg-white py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <button 
              onClick={handleBack}
              className="text-orange-500 hover:text-orange-600 flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back to Event</span>
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              Select Tickets
            </h1>
          </div>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center text-sm font-medium">
            <div className="flex items-center text-orange-500">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-500 mr-2">
                <Ticket className="w-4 h-4" />
              </div>
              <span>Tickets</span>
            </div>
            
            <div className="w-24 h-0.5 mx-2 bg-gray-300"></div>
            
            <div className="flex items-center text-gray-400">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 mr-2">
                <User className="w-4 h-4" />
              </div>
              <span>Information</span>
            </div>
            
            <div className="w-24 h-0.5 mx-2 bg-gray-300"></div>
            
            <div className="flex items-center text-gray-400">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 mr-2">
                <Ticket className="w-4 h-4" />
              </div>
              <span>Confirmation</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Event Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-green-200 rounded-lg mr-4 flex items-center justify-center text-xs font-bold">
                  MeetKats
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h2>
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                      Fri, May 30
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-500" />
                      07:30 PM
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ticket Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Select Tickets</h3>
              
              <div className="space-y-4">
                {ticketTypes.map(ticket => {
                  const ticketId = ticket.id;
                  const currentQty = selectedTickets[ticketId] || 0;
                  
                  return (
                    <div 
                      key={ticketId} 
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-3 md:mb-0">
                          <h4 className="font-bold text-gray-900">{ticket.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          
                          <div className="mt-1 text-sm">
                            <span className="text-gray-500">
                              {ticket.available} available
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end">
                          <div className="font-bold text-gray-900 md:text-right md:mr-4">
                            {ticket.price === 0 ? 'Free' : `$${ticket.price.toFixed(2)}`}
                          </div>
                          
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button 
                              type="button"
                              onClick={() => handleTicketQuantityChange(ticketId, -1)}
                              disabled={currentQty === 0}
                              className={`p-2 ${
                                currentQty === 0
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
                              className="p-2 text-gray-600 hover:bg-gray-100"
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
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={orderSummary.ticketCount === 0}
              className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                orderSummary.ticketCount === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              Continue to Information
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
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
                          <p className="text-sm text-gray-600">{item.quantity} × {item.price === 0 ? 'Free' : `$${item.price.toFixed(2)}`}</p>
                        </div>
                        <div className="font-medium">
                          {item.price === 0 ? 'Free' : `$${item.total.toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{orderSummary.subtotal === 0 ? 'Free' : `$${orderSummary.subtotal.toFixed(2)}`}</span>
                    </div>
                    
                    {orderSummary.fees > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Service Fee</span>
                        <span>${orderSummary.fees.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>{orderSummary.total === 0 ? 'Free' : `$${orderSummary.total.toFixed(2)}`}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Ticket className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-gray-600 font-medium">No tickets selected</p>
                  <p className="text-sm text-gray-500 mt-2">Select tickets to continue</p>
                </div>
              )}
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    Tickets are free but registration is required. Please review your information before completing your booking.
                  </p>
                </div>
              </div>
              
              {/* Added Policy Links */}
              <div className="mt-4 space-y-3">
                <button 
                  onClick={() => openPolicyModal('terms')}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Terms and Conditions</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
                
                <button 
                  onClick={() => openPolicyModal('privacy')}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Privacy Policy</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
                
                <button 
                  onClick={() => openPolicyModal('refund')}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <RefreshCw className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Refund Policy</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                    {getPolicyContent().icon}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {getPolicyContent().title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {getPolicyContent().content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closePolicyModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketConfirmationPage;