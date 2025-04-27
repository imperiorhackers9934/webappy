import api from './api';

// Helper function to normalize MongoDB _id to id for frontend
const normalizeData = (data) => {
  if (!data) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      id: item._id || item.id,
      ...item,
    }));
  }
  
  return {
    id: data._id || data.id,
    ...data
  };
};

const ticketService = {
  /**
   * Create ticket type for an event
   * @param {string} eventId - Event ID
   * @param {Object} ticketData - Ticket type data
   * @returns {Promise<Object>} - Created ticket type
   */
  createTicketType: async (eventId, ticketData) => {
    try {
      const response = await api.post(`/api/bookings/events/${eventId}/ticket-types`, ticketData);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error creating ticket type for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Get ticket types for an event (public access)
   * @param {string} eventId - Event ID
   * @param {boolean} includeInactive - Whether to include inactive ticket types
   * @returns {Promise<Array>} - List of ticket types
   */
  getEventTicketTypes: async (eventId, includeInactive = false) => {
    try {
      // Try to use the public endpoint first
      const params = includeInactive ? { includeInactive: 'true' } : {};
      
      try {
        // First try the public endpoint without authentication
        const response = await api.get(`/api/bookings/events/${eventId}/ticket-types`, { params });
        console.log(`Successfully fetched ${response.data?.length || 0} ticket types from public endpoint`);
        
        // Return the normalized data directly, not wrapped in an object
        return {
          data: normalizeData(response.data) || []
        };
      } catch (firstError) {
        // Fall back to the authenticated endpoint if public endpoint fails
        console.log('Falling back to bookings endpoint for ticket types');
        const response = await api.get(`/api/bookings/events/${eventId}/ticket-types`, { params });
        console.log(`Successfully fetched ${response.data?.length || 0} ticket types from booking endpoint`);
        
        // Return the normalized data directly, not wrapped in an object
        return {
          data: normalizeData(response.data) || []
        };
      }
    } catch (error) {
      console.error(`Error fetching ticket types for event ${eventId}:`, error);
      // Return an object with empty array for data to maintain consistent return structure
      return { data: [] };
    }
  },

  /**
   * Get ticket types for an event (admin/creator access)
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} - List of ticket types including inactive ones
   */
  getManageableTicketTypes: async (eventId) => {
    try {
      // Use the admin endpoint that requires authentication
      const response = await api.get(`/api/bookings/events/${eventId}/manage-ticket-types`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching manageable ticket types for event ${eventId}:`, error);
      throw error;
    }
  },

// Corrected bookEventTickets function for eventService.js
// Add this to your ticketService.js file

// Enhanced bookEventTickets function with detailed error inspection
// Replace in ticketService.js

/**
 * Book tickets for an event
 * @param {string} eventId - Event ID
 * @param {Object} bookingData - Booking data including ticket selections
 * @returns {Promise<Object>} - Booking confirmation
 */
/**
 * Book tickets for an event with enhanced error logging
 * @param {string} eventId - Event ID
 * @param {Object} bookingData - Booking data including ticket selections
 * @returns {Promise<Object>} - Booking confirmation
 *,
// Enhanced bookEventTickets function with detailed error inspection

/**
 * Book tickets for an event with complete error handling and validation
 * Specifically fixed for the server's expected data structure
 * @param {string} eventId - Event ID
 * @param {Object} bookingData - Booking data including ticket selections and customer info
 * @returns {Promise<Object>} - Booking confirmation
 */
bookEventTickets: async (eventId, bookingData) => {
  try {
    console.log(`Booking tickets for event ${eventId} with data:`, JSON.stringify(bookingData, null, 2));
    
    // Clone the booking data to avoid mutating the original
    const processedBookingData = { ...bookingData };
    
    // Validate the tickets data structure
    if (!processedBookingData.ticketSelections || !Array.isArray(processedBookingData.ticketSelections) || processedBookingData.ticketSelections.length === 0) {
      // If using legacy format, transform it to the expected format
      if (processedBookingData.tickets && Array.isArray(processedBookingData.tickets) && processedBookingData.tickets.length > 0) {
        console.log('Converting legacy tickets format to ticketSelections');
        processedBookingData.ticketSelections = processedBookingData.tickets.map(ticket => ({
          ticketTypeId: ticket.ticketType || ticket.ticketTypeId,
          quantity: parseInt(ticket.quantity, 10)
        }));
        delete processedBookingData.tickets;
      } else {
        throw new Error('At least one ticket must be selected');
      }
    }
    
    // Ensure all ticketSelections use ticketTypeId, not ticketType
    processedBookingData.ticketSelections = processedBookingData.ticketSelections.map(selection => {
      // If using legacy "ticketType" field, convert to "ticketTypeId"
      if (selection.ticketType && !selection.ticketTypeId) {
        return {
          ticketTypeId: selection.ticketType,
          quantity: parseInt(selection.quantity, 10)
        };
      }
      
      // Otherwise ensure quantity is a number
      return {
        ticketTypeId: selection.ticketTypeId,
        quantity: parseInt(selection.quantity, 10)
      };
    });
    
    // Add payment method for free tickets if not provided
    if (!processedBookingData.paymentMethod) {
      const allFreeTickets = true; // Assume all tickets are free for this simplified fix
      processedBookingData.paymentMethod = allFreeTickets ? 'free' : 'pending';
      console.log(`Added default paymentMethod: ${processedBookingData.paymentMethod}`);
    }
    
    // CRITICAL FIX: The server's controller requires contactInformation instead of customerInfo
    if (processedBookingData.customerInfo && !processedBookingData.contactInformation) {
      processedBookingData.contactInformation = {
        email: processedBookingData.customerInfo.email,
        phone: processedBookingData.customerInfo.phone || ''
      };
      console.log('Transformed customerInfo to contactInformation as required by server');
    }
    
    // Keep the original customerInfo in case it's needed elsewhere
    
    // Add returnUrl for payment processing if needed
    if (!processedBookingData.returnUrl) {
      processedBookingData.returnUrl = window.location.origin + '/payment-confirmation';
      console.log(`Added returnUrl: ${processedBookingData.returnUrl}`);
    }
    
    console.log('Prepared booking data to send:', JSON.stringify(processedBookingData, null, 2));
    
    // Try the primary booking endpoint
    try {
      const response = await api.post(`/api/bookings/events/${eventId}/book`, processedBookingData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Booking API response:', response.data);
      return normalizeData(response.data);
    } catch (primaryError) {
      // Log the primary endpoint error
      console.error('Primary endpoint error:', primaryError);
      
      if (primaryError.response && primaryError.response.data) {
        console.error('Server error response:', primaryError.response.data);
        
        // Check for validation errors
        if (primaryError.response.data.errors && Array.isArray(primaryError.response.data.errors)) {
          const errorDetails = primaryError.response.data.errors.map(err => 
            err.msg || err.message || JSON.stringify(err)
          ).join('; ');
          
          if (errorDetails) {
            throw new Error(`Validation failed: ${errorDetails}`);
          }
        }
        
        // Check for error message
        if (primaryError.response.data.error) {
          throw new Error(primaryError.response.data.error);
        }
        
        if (primaryError.response.data.message) {
          throw new Error(primaryError.response.data.message);
        }
      }
      
      // If no specific error message was extracted, throw the original error
      throw primaryError;
    }
  } catch (error) {
    console.error(`Error booking tickets for event ${eventId}:`, error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    
    // If we get here, rethrow the original error or a generic message
    throw error.message ? new Error(error.message) : new Error('Failed to book tickets. Please try again.');
  }
},
  /**
   * Get user bookings
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - User's bookings
   */
  getUserBookings: async (filters = {}) => {
    try {
      const response = await api.get('/api/bookings/my', { params: filters });
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  /**
   * Get a specific booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} - Booking details
   */
  getBooking: async (bookingId) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching booking ${bookingId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancellation confirmation
   */
  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling booking ${bookingId}:`, error);
      throw error;
    }
  },

  /**
 * Check in a ticket using either QR data or verification code
 * @param {string} ticketId - The ticket ID
 * @param {Object} data - Data object with qrData or verificationCode
 * @returns {Promise<Object>} - Check-in result
 */
/**
 * Check in a ticket using either QR data or verification code
 * @param {string} ticketId - The ticket ID
 * @param {Object} data - Data object with qrData or verificationCode
 * @returns {Promise<Object>} - Check-in result
 */
checkInTicket: async (ticketId, data) => {
  try {
    // Add logging to help debug the issue
    console.log(`Checking in ticket: ${ticketId}`);
    console.log('Check-in data:', JSON.stringify(data));

    // Fix: Add /api prefix to the URL
    const response = await api.post(`/api/bookings/tickets/${ticketId}/check-in`, data);
    
    // Log the response
    console.log('Check-in response:', response.data);
    
    return response.data;
  } catch (error) {
    // Improved error handling with more details
    console.error('Error checking in ticket:', error);
    
    // Check for connection errors
    if (!error.response) {
      throw new Error('Connection error. Please check your internet connection.');
    }
    
    // Handle specific error status codes
    if (error.response.status === 404) {
      throw new Error('Ticket not found');
    } else if (error.response.status === 400) {
      // Extract the specific error message from the response if available
      const errorMessage = error.response.data?.error || 'Invalid ticket data';
      throw new Error(errorMessage);
    } else if (error.response.status === 403) {
      throw new Error('You do not have permission to check in this ticket');
    } else if (error.response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    // General error fallback
    throw error.response.data?.error 
      ? new Error(error.response.data.error)
      : new Error('Failed to check in ticket');
  }
},

/**
 * Verify a ticket using a manual verification code
 * @param {string} eventId - The event ID
 * @param {string} code - The verification code
 * @returns {Promise<Object>} - Verification result
 */
verifyTicketByCode: async (eventId, code) => {
  try {
    console.log(`Verifying ticket for event ${eventId} with code: ${code}`);
    
    // Update the endpoint path to use the /api/bookings prefix
    const response = await api.post(`/api/bookings/events/${eventId}/verify-ticket`, { 
      verificationCode: code 
    });
    
    console.log('Verification response:', response.data);
    return response.data;
  } catch (error) {
    if (!error.response) {
      throw new Error('Connection error. Please check your internet connection.');
    }
    
    if (error.response.status === 404) {
      throw new Error('Invalid verification code');
    }
    
    throw error.response.data?.error 
      ? new Error(error.response.data.error)
      : new Error('Failed to verify ticket');
  }
},
  /**
   * Transfer a ticket to another user
   * @param {string} ticketId - Ticket ID
   * @param {Object} transferData - Transfer data with recipient info
   * @returns {Promise<Object>} - Transfer confirmation
   */
  transferTicket: async (ticketId, transferData) => {
    try {
      const response = await api.post(`/api/bookings/tickets/${ticketId}/transfer`, transferData);
      return response.data;
    } catch (error) {
      console.error(`Error transferring ticket ${ticketId}:`, error);
      throw error;
    }
  },

  /**
   * Download a ticket PDF
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Blob>} - PDF file blob
   */
  downloadTicketPdf: async (ticketId) => {
    try {
      const response = await api.get(`/api/bookings/tickets/${ticketId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading ticket PDF ${ticketId}:`, error);
      throw error;
    }
  },

  /**
   * Get all tickets for an event (for organizers)
   * @param {string} eventId - Event ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Tickets and stats
   */
  getEventTickets: async (eventId, filters = {}) => {
    try {
      // Use the existing endpoint (no "all-" prefix)
      const response = await api.get(`/api/bookings/events/${eventId}/tickets`, { params: filters });
      return {
        tickets: normalizeData(response.data?.tickets),
        stats: response.data?.stats,
        pagination: response.data?.pagination
      };
    } catch (error) {
      console.error(`Error fetching tickets for event ${eventId}:`, error);
      return { tickets: [], stats: {}, pagination: {} }; // Return empty data on error
    }
  },

  /**
   * Get booking statistics for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} - Booking statistics
   */
  getEventBookingStats: async (eventId) => {
    try {
      const response = await api.get(`/api/bookings/events/${eventId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching booking stats for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Generate event report
   * @param {string} eventId - Event ID
   * @param {string} format - Report format ('json' or 'csv')
   * @returns {Promise<Object|Blob>} - Report data
   */
  generateEventReport: async (eventId, format = 'json') => {
    try {
      const response = await api.get(`/api/bookings/events/${eventId}/report`, { 
        params: { format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error(`Error generating report for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Process payment confirmation
   * @param {string} bookingId - Booking ID
   * @param {Object} paymentData - Payment confirmation data
   * @returns {Promise<Object>} - Payment confirmation result
   */
  confirmPayment: async (bookingId, paymentData) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/confirm-payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Error confirming payment for booking ${bookingId}:`, error);
      throw error;
    }
  },
  
  /**
   * Add event to calendar (alternative implementation)
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} - Calendar addition result
   */
// Replace the existing addToCalendar function in ticketService.js with this updated version

/**
 * Add event to calendar (fixed implementation)
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} - Calendar addition result
 */
addToCalendar: async (eventId) => {
  try {
    // Check if eventId is valid
    if (!eventId) {
      throw new Error('Invalid event ID');
    }
    
    console.log(`Attempting to add event ${eventId} to calendar from ticketService`);
    
    // Get browser platform instead of Platform.OS which might not be defined
    const platform = navigator.userAgent.toLowerCase().includes('android') 
      ? 'android' 
      : navigator.userAgent.toLowerCase().includes('iphone') || navigator.userAgent.toLowerCase().includes('ipad')
        ? 'ios'
        : 'web';
    
    const response = await api.post(`/api/events/${eventId}/calendar`, {
      platform: platform,
      calendarType: 'default'
    });
    
    return response.data;
  } catch (error) {
    // Log detailed error information
    console.error(`Error adding event ${eventId} to calendar:`, error);
    
    if (error.response?.data) {
      console.log('API error details:', error.response.data);
    }
    
    // Provide a useful error message based on the error code
    if (error.response?.status === 400) {
      throw new Error('Calendar request was invalid: missing event details');
    } else if (error.response?.status === 404) {
      throw new Error('Calendar service not available');
    } else if (error.response?.status === 401) {
      throw new Error('Calendar access not authorized');
    }
    
    // Default error
    throw new Error(`Calendar error: ${error.message || 'Unknown error'}`);
  }
}
};

export default ticketService;
