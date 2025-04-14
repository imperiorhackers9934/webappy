// src/services/eventService.js
import api from './api';

// Current user ID (retrieved from auth state)
let currentUserId = null;

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

// Helper function to map frontend category values to backend enum values
function mapCategory(category) {
  // Map from uppercase categories to schema's enum values
  const categoryMap = {
    'TECHNOLOGY': 'technology',
    'BUSINESS': 'business',
    'NETWORKING': 'business',
    'SOCIAL': 'social',
    'EDUCATION': 'education',
    'ARTS_CULTURE': 'entertainment',
    'HEALTH_WELLNESS': 'health',
    'CAREER': 'business',
    'OTHER': 'other'
  };
  
  return categoryMap[category] || 'other'; // Default to 'other' if no mapping exists
}

// Functions to get and set the current user ID
const getCurrentUserId = () => currentUserId;
const setCurrentUserId = (userId) => {
  currentUserId = userId;
  return currentUserId;
};

// Function to check network connectivity
const checkNetworkConnectivity = () => {
  return navigator.onLine;
};

// Test connection to server
const testConnection = async () => {
  try {
    const connected = checkNetworkConnectivity();
    if (!connected) {
      return { success: false, error: 'No internet connection' };
    }
    
    console.log('Testing connection to server...');
    const response = await api.get('/health', { timeout: 5000 });
    return { success: response.status === 200, data: response.data };
  } catch (error) {
    console.error('Server connection test failed:', error);
    return { success: false, error: error.message };
  }
};

const eventService = {
  // User ID management
  getCurrentUserId,
  setCurrentUserId,
  
  // Get all events with filters
  getEvents: async (filters = {}) => {
    try {
      // Use the correct API path
      const response = await api.get('/api/events', { params: filters });
      
      // If response is an array, normalize it directly
      if (Array.isArray(response.data)) {
        return {
          data: normalizeData(response.data)
        };
      }
      
      // Handle structured response (with events, categories, pagination)
      return {
        data: normalizeData(response.data?.events || response.data || []),
        categories: response.data?.categories,
        pagination: response.data?.pagination
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get a specific event by ID
  getEvent: async (eventId) => {
    try {
      const response = await api.get(`/api/events/${eventId}`);
      return {
        data: normalizeData(response.data || response)
      };
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      throw error;
    }
  },

  // Create a new event
  createEvent: async (eventData) => {
    try {
      console.log('Creating event with data:', eventData);
      
      // Check network connectivity first
      const isConnected = checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('No internet connection. Please check your network settings and try again.');
      }
      
      // Create a FormData object for sending both JSON data and files
      const formData = new FormData();
      
      // Append all the JSON fields to the FormData - USING THE CORRECT FIELD NAMES TO MATCH BACKEND
      formData.append('name', eventData.title); // Backend expects 'name' not 'title'
      formData.append('description', eventData.description || '');
      formData.append('startDateTime', new Date(eventData.startDate).toISOString());
      
      if (eventData.endDate) {
        formData.append('endDateTime', new Date(eventData.endDate).toISOString());
      }
      
      formData.append('virtual', eventData.isOnline ? 'true' : 'false');
      formData.append('category', mapCategory(eventData.category));
      formData.append('visibility', eventData.isPrivate ? 'private' : 'public');
      
      if (eventData.maxAttendees) {
        formData.append('maxAttendees', eventData.maxAttendees.toString());
      }
      
      // Add location if this is not an online event
      if (!eventData.isOnline && eventData.location) {
        formData.append('location[name]', eventData.location);
        
        // These fields are optional but expected by the backend
        if (eventData.locationDetails) {
          if (eventData.locationDetails.address)
            formData.append('location[address]', eventData.locationDetails.address);
          if (eventData.locationDetails.city)
            formData.append('location[city]', eventData.locationDetails.city);
          if (eventData.locationDetails.state)
            formData.append('location[state]', eventData.locationDetails.state);
          if (eventData.locationDetails.country)
            formData.append('location[country]', eventData.locationDetails.country);
          if (eventData.locationDetails.postalCode)
            formData.append('location[postalCode]', eventData.locationDetails.postalCode);
        } else {
          // Add empty values to ensure the location object is created properly
          formData.append('location[address]', '');
          formData.append('location[city]', '');
          formData.append('location[state]', '');
          formData.append('location[country]', '');
          formData.append('location[postalCode]', '');
        }
      }
      
      // Add cover image - use coverImage field name for web
      if (eventData.coverImage) {
        formData.append('coverImage', eventData.coverImage);
        console.log('Appending image for event creation');
      }
      
      console.log('Sending form data to create event');
      
      // Make the API request with the FormData
      const response = await api.post('/api/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 60000 // 60 second timeout for upload
      });
      
      return {
        data: normalizeData(response.data || response)
      };
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error details:', error.response?.data);
      
      // If there's a network error, try the fallback approach
      if (error.message === 'Network Error') {
        console.log('Network error detected, trying fallback approach...');
        return eventService.createEventWithoutImage(eventData);
      }
      
      throw error;
    }
  },

  // Fallback method to create event without image
  createEventWithoutImage: async (eventData) => {
    try {
      console.log('Attempting to create event without image...');
      
      // Create a simple JSON payload instead of FormData
      const payload = {
        name: eventData.title,
        description: eventData.description || '',
        startDateTime: new Date(eventData.startDate).toISOString(),
        endDateTime: eventData.endDate ? new Date(eventData.endDate).toISOString() : undefined,
        virtual: eventData.isOnline,
        category: mapCategory(eventData.category),
        visibility: eventData.isPrivate ? 'private' : 'public',
        maxAttendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : undefined
      };
      
      // Add location if needed
      if (!eventData.isOnline && eventData.location) {
        payload.location = {
          name: eventData.location,
          address: eventData.locationDetails?.address || '',
          city: eventData.locationDetails?.city || '',
          state: eventData.locationDetails?.state || '',
          country: eventData.locationDetails?.country || '',
          postalCode: eventData.locationDetails?.postalCode || ''
        };
      }
      
      // Send the request with JSON
      const response = await api.post('/api/events', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      return {
        data: normalizeData(response.data || response),
        imageSkipped: true,
        message: 'Event created successfully but without an image due to upload issues. You can add an image later.'
      };
    } catch (error) {
      console.error('Error in fallback event creation:', error);
      throw new Error('Failed to create event. Please try again later or check your network connection.');
    }
  },

  // Update an existing event
  updateEvent: async (eventId, eventData) => {
    try {
      // Create a FormData object for sending both JSON data and files
      const formData = new FormData();
      
      // Append all available fields to the FormData
      if (eventData.title) formData.append('name', eventData.title); // Use 'name', not 'title'
      if (eventData.description !== undefined) formData.append('description', eventData.description);
      if (eventData.startDate) formData.append('startDateTime', new Date(eventData.startDate).toISOString());
      if (eventData.endDate) formData.append('endDateTime', new Date(eventData.endDate).toISOString());
      if (eventData.isOnline !== undefined) formData.append('virtual', eventData.isOnline ? 'true' : 'false');
      if (eventData.category) formData.append('category', mapCategory(eventData.category));
      if (eventData.isPrivate !== undefined) formData.append('visibility', eventData.isPrivate ? 'private' : 'public');
      if (eventData.maxAttendees) formData.append('maxAttendees', eventData.maxAttendees.toString());
      
      // Add location if this is not an online event
      if (!eventData.isOnline && eventData.location) {
        formData.append('location[name]', eventData.location);
        // Add other location fields if available
        if (eventData.locationDetails) {
          if (eventData.locationDetails.address)
            formData.append('location[address]', eventData.locationDetails.address);
          if (eventData.locationDetails.city)
            formData.append('location[city]', eventData.locationDetails.city);
          if (eventData.locationDetails.state)
            formData.append('location[state]', eventData.locationDetails.state);
          if (eventData.locationDetails.country)
            formData.append('location[country]', eventData.locationDetails.country);
          if (eventData.locationDetails.postalCode)
            formData.append('location[postalCode]', eventData.locationDetails.postalCode);
        }
      }
      
      // Add cover image if provided - for web browsers, handle as standard file
      if (eventData.coverImage) {
        formData.append('file', eventData.coverImage); 
        console.log('Appending image for update');
      }
      
      // Make the API request with the FormData
      const response = await api.put(`/api/events/${eventId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 60000 // 60 second timeout for upload
      });
      
      return {
        data: normalizeData(response.data || response)
      };
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async (eventId, deleteSeries = false) => {
    try {
      const queryParams = deleteSeries ? { deleteSeries: 'true' } : {};
      const response = await api.delete(`/api/events/${eventId}`, { params: queryParams });
      return response.data;
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      throw error;
    }
  },

  // Respond to an event (going, maybe, declined)
  respondToEvent: async (eventId, status, message = '') => {
    try {
      // Make sure to format the status correctly
      // Convert status to uppercase and ensure it's in the expected format
      const statusMap = {
        'ATTENDING': 'GOING',
        'GOING': 'GOING',
        'MAYBE': 'MAYBE',
        'DECLINED': 'DECLINED',
        'NO': 'DECLINED'
      };
      
      // Convert to uppercase for consistency
      const normalizedStatus = typeof status === 'string' 
        ? status.toUpperCase() 
        : status;
      
      // Map to a valid status value
      const validStatus = statusMap[normalizedStatus] || normalizedStatus;
      
      console.log(`Sending event response with status: ${validStatus}`);
      
      const response = await api.post(`/api/events/${eventId}/respond`, { 
        status: validStatus, 
        message 
      });
      return response.data;
    } catch (error) {
      console.error(`Error responding to event ${eventId}:`, error);
      throw error;
    }
  },

  // Get event attendees
  getEventAttendees: async (eventId, filters = {}) => {
    try {
      const response = await api.get(`/api/events/${eventId}/attendees`, { params: filters });
      return {
        going: normalizeData(response.data?.going),
        maybe: normalizeData(response.data?.maybe),
        declined: normalizeData(response.data?.declined),
        pending: normalizeData(response.data?.pending),
        invited: normalizeData(response.data?.invited),
        hosts: normalizeData(response.data?.hosts)
      };
    } catch (error) {
      console.error(`Error fetching attendees for event ${eventId}:`, error);
      throw error;
    }
  },

  // Invite users to an event
  inviteToEvent: async (eventId, userIds, message = '', role = 'attendee') => {
    try {
      const response = await api.post(`/api/events/${eventId}/invite`, { 
        userIds, 
        message, 
        role 
      });
      return response.data;
    } catch (error) {
      console.error(`Error inviting users to event ${eventId}:`, error);
      throw error;
    }
  },

  // Check in to an event
  checkInToEvent: async (eventId, data = {}) => {
    try {
      const response = await api.post(`/api/events/${eventId}/check-in`, data);
      return response.data;
    } catch (error) {
      console.error(`Error checking in to event ${eventId}:`, error);
      throw error;
    }
  },

  // Get event analytics
  getEventAnalytics: async (eventId) => {
    try {
      const response = await api.get(`/api/events/${eventId}/analytics`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching analytics for event ${eventId}:`, error);
      throw error;
    }
  },

  // Get my events (attending and hosting)
  getMyEvents: async () => {
    try {
      // Backend endpoint returns events where the user is hosting or attending
      const response = await api.get('/api/events/my');
      return {
        data: normalizeData(response.data?.events || response.data || [])
      };
    } catch (error) {
      console.error('Error fetching user events:', error);
      throw error;
    }
  },
  
  // Get suggested users to invite
  getSuggestedUsers: async (eventId, limit = 10) => {
    try {
      const response = await api.get(`/api/events/${eventId}/suggested-users`, { params: { limit } });
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching suggested users for event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Search users for inviting
  searchUsersForInvite: async (eventId, query, limit = 10) => {
    try {
      const response = await api.get(`/api/events/${eventId}/search-users`, { 
        params: { query, limit } 
      });
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error searching users for event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Add event photo
  addEventPhoto: async (eventId, photo, caption = '') => {
    try {
      const formData = new FormData();
      
      // Add the photo file directly - web version
      formData.append('photo', photo);
      
      // Add caption if provided
      if (caption) {
        formData.append('caption', caption);
      }
      
      console.log('Uploading event photo');
      
      const response = await api.post(`/api/events/${eventId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // Extend timeout for upload
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error adding photo to event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Get event photos
  getEventPhotos: async (eventId) => {
    try {
      const response = await api.get(`/api/events/${eventId}/photos`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching photos for event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Generate check-in code
  generateCheckInCode: async (eventId) => {
    try {
      const response = await api.post(`/api/events/${eventId}/checkin-code`);
      return response.data;
    } catch (error) {
      console.error(`Error generating check-in code for event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Add comment to event
  addEventComment: async (eventId, content) => {
    try {
      const response = await api.post(`/api/events/${eventId}/comments`, { content });
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error adding comment to event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Get event comments
  getEventComments: async (eventId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/api/events/${eventId}/comments`, { params: { page, limit } });
      return {
        comments: normalizeData(response.data?.comments),
        pagination: response.data?.pagination
      };
    } catch (error) {
      console.error(`Error fetching comments for event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Get similar events
  getSimilarEvents: async (eventId, limit = 5) => {
    try {
      const response = await api.get(`/api/events/${eventId}/similar`, { params: { limit } });
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching similar events for event ${eventId}:`, error);
      throw error;
    }
  },
  
  // Add to calendar 
  addToCalendar: async (eventId) => {
    try {
      // Check if eventId is valid
      if (!eventId) {
        throw new Error('Invalid event ID');
      }
      
      console.log(`Attempting to add event ${eventId} to calendar`);
      
      // Try with simple JSON format that the API might expect
      const response = await api.post(`/api/events/${eventId}/calendar`, {
        // Include any API-required parameters
        provider: 'default',
        platform: 'web'
      });
      
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.error(`Error adding event ${eventId} to calendar:`, error);
      console.log('API response:', error.response?.data);
      
      // Provide a useful error message
      if (error.response && error.response.status === 400) {
        const errorDetail = error.response.data?.error || error.response.data?.message || 'Calendar request was invalid';
        throw new Error(`Failed to add to calendar: ${errorDetail}`);
      } else if (error.response && error.response.status === 404) {
        throw new Error('Calendar service not available');
      } else if (error.response && error.response.status === 401) {
        throw new Error('Calendar access not authorized');
      }
      
      // Default error
      throw new Error(`Calendar error: ${error.message}`);
    }
  },

  // Test connection to the API server
  testConnection: async () => {
    return await testConnection();
  },

  //========== TICKET FUNCTIONALITY ==========//

  // Get ticket types for an event
  getEventTicketTypes: async (eventId) => {
    try {
      // Try to use the public endpoint first
      try {
        const response = await api.get(`/api/events/${eventId}/ticket-types`);
        return normalizeData(response.data);
      } catch (error) {
        // Fall back to booking endpoint if public one fails
        console.log('Falling back to bookings endpoint for ticket types');
        const response = await api.get(`/api/bookings/events/${eventId}/ticket-types`);
        return normalizeData(response.data);
      }
    } catch (error) {
      console.error(`Error fetching ticket types for event ${eventId}:`, error);
      throw error;
    }
  },

  // Create a ticket type for an event
  createTicketType: async (eventId, ticketData) => {
    try {
      console.log(`Creating ticket type for event ${eventId}:`, JSON.stringify(ticketData));
      
      // Check network connectivity first
      const isConnected = checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('No internet connection. Please check your network settings and try again.');
      }
      
      // Clean up the ticket data before sending to the API
      const cleanTicketData = { ...ticketData };
      
      // Remove null values for endSaleDate - backend doesn't like null for dates
      if (cleanTicketData.endSaleDate === null) {
        delete cleanTicketData.endSaleDate;
      }
      
      // Ensure we're using the correct endpoint
      const response = await api.post(`/api/bookings/events/${eventId}/ticket-types`, cleanTicketData);
      
      console.log('Ticket type creation response:', response.data);
      
      return normalizeData(response.data);
    } catch (error) {
      // Enhanced error logging
      console.error(`Error creating ticket type for event ${eventId}:`, error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server response data:', error.response.data);
        console.error('Server response status:', error.response.status);
        
        // Extract validation errors if they exist
        if (error.response.data && error.response.data.errors) {
          const validationErrors = error.response.data.errors.map(e => e.msg).join(', ');
          throw new Error(`Validation error: ${validationErrors}`);
        }
        
        // Throw a more descriptive error
        if (error.response.data && error.response.data.message) {
          throw new Error(`Server error: ${error.response.data.message}`);
        } else if (error.response.data && error.response.data.error) {
          throw new Error(`Server error: ${error.response.data.error}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please try again later.');
      }
      
      // Pass the original error if we can't provide more context
      throw error;
    }
  },

  // Update a ticket type
  updateTicketType: async (ticketTypeId, ticketData) => {
    try {
      const response = await api.put(`/api/bookings/ticket-types/${ticketTypeId}`, ticketData);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error updating ticket type ${ticketTypeId}:`, error);
      throw error;
    }
  },

  // Delete a ticket type
  deleteTicketType: async (ticketTypeId) => {
    try {
      const response = await api.delete(`/api/bookings/ticket-types/${ticketTypeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ticket type ${ticketTypeId}:`, error);
      throw error;
    }
  },

  // Book tickets for an event
  bookEventTickets: async (eventId, bookingData) => {
    try {
      const response = await api.post(`/api/bookings/events/${eventId}/book`, bookingData);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error booking tickets for event ${eventId}:`, error);
      throw error;
    }
  },

  // Get a user's bookings
  getUserBookings: async (filters = {}) => {
    try {
      const response = await api.get('/api/bookings/my', { params: filters });
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  // Get a specific booking
  getBooking: async (bookingId) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching booking ${bookingId}:`, error);
      throw error;
    }
  },

  // Cancel a booking
  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling booking ${bookingId}:`, error);
      throw error;
    }
  },

  // Check in a ticket
  checkInTicket: async (ticketId, checkInData) => {
    try {
      const response = await api.post(`/api/bookings/tickets/${ticketId}/check-in`, checkInData);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error checking in ticket ${ticketId}:`, error);
      throw error;
    }
  },

  // Transfer a ticket to another user
  transferTicket: async (ticketId, transferData) => {
    try {
      const response = await api.post(`/api/bookings/tickets/${ticketId}/transfer`, transferData);
      return response.data;
    } catch (error) {
      console.error(`Error transferring ticket ${ticketId}:`, error);
      throw error;
    }
  },

  // Get all tickets for an event (for organizers)
  getEventTickets: async (eventId, filters = {}) => {
    try {
      // Use the existing endpoint (no "all-" prefix)
      const response = await api.get(`/api/bookings/events/${eventId}/tickets`, { params: filters });
      return {
        tickets: normalizeData(response.data?.tickets),
        stats: response.data?.stats
      };
    } catch (error) {
      console.error(`Error fetching tickets for event ${eventId}:`, error);
      throw error;
    }
  },

  // Download a ticket as PDF
  downloadTicketPdf: async (ticketId) => {
    try {
      // This will need to be handled differently as it returns a PDF file
      const response = await api.get(`/api/bookings/tickets/${ticketId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading PDF for ticket ${ticketId}:`, error);
      throw error;
    }
  },

  // Get booking statistics for an event
  getEventBookingStats: async (eventId) => {
    try {
      const response = await api.get(`/api/bookings/events/${eventId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching booking stats for event ${eventId}:`, error);
      throw error;
    }
  },

  // Generate an event report
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

  // Verify ticket by manual code entry
  verifyTicketByCode: async (eventId, verificationCode) => {
    try {
      const response = await api.post(`/api/bookings/events/${eventId}/verify-code`, { 
        verificationCode 
      });
      return response.data;
    } catch (error) {
      console.error(`Error verifying ticket code for event ${eventId}:`, error);
      throw error;
    }
  },

  // Process payment confirmation
  confirmPayment: async (bookingId, paymentData) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/confirm-payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Error confirming payment for booking ${bookingId}:`, error);
      throw error;
    }
  }
};

export default eventService;