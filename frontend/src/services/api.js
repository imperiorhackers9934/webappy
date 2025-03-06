import axios from 'axios';
import socketManager from './socketmanager';

// Determine API base URL from environment or default
const baseURL = import.meta.env.VITE_API_URL || "https://myapp-uc9m.onrender.com"
const logApiCall = (method, url, data = null, error = null) => {
  if (error) {
    console.log(`🔴 API ERROR [${method}] ${url}:`, error);
  } else if (data) {
    console.log(`🟢 API SUCCESS [${method}] ${url}:`, data);
  } else {
    console.log(`🟡 API CALL [${method}] ${url}`);
  }
};
// Create axios instance with default config
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and disconnect socket on authentication failure
      localStorage.removeItem('token');
      socketManager.disconnect();
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // Establish Socket.IO connection after login
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      socketManager.connect(response.data.token);
    }
    
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    
    // Establish Socket.IO connection after signup
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      socketManager.connect(response.data.token);
    }
    
    return response.data;
  },

  getUserInfo: async () => {
    const response = await api.get('/api/me');
    return response.data;
  },

  sendPhoneVerification: async (phoneNumber) => {
    const response = await api.post('/auth/phone/send-code', { phoneNumber });
    return response.data;
  },

  verifyPhone: async (phoneNumber, code, deviceToken = null) => {
    const response = await api.post('/auth/phone/verify', {
      phoneNumber,
      code,
      deviceToken
    });
    
    // Establish Socket.IO connection after phone verification
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      socketManager.connect(response.data.token);
    }
    
    return response.data;
  },

  logout: async () => {
    try {
      // Disconnect socket before logout
      socketManager.disconnect();
      
      const response = await api.post('/api/auth/logout');
      localStorage.removeItem('token');
      return response.data;
    } catch (error) {
      // Ensure socket is disconnected even if logout fails
      socketManager.disconnect();
      localStorage.removeItem('token');
      throw error;
    }
  },
  
  // Check auth provider for a given email or phone
  checkAuthProvider: async (identifier) => {
    const payload = identifier.includes('@') 
      ? { email: identifier } 
      : { phoneNumber: identifier };
    
    const response = await api.post('/auth/check-provider', payload);
    return response.data;
  },
  
  // Two-factor authentication setup
  setup2FA: async (method) => {
    const response = await api.post('/api/auth/2fa/setup', { method });
    return response.data;
  },

  // OAuth Login with Google
  googleLogin: () => {
    window.location.href = `${baseURL}/auth/google`;
  },

  // OAuth Login with LinkedIn
  linkedinLogin: () => {
    window.location.href = `${baseURL}/auth/linkedin`;
  }
};

// Profile endpoints
const profileService = {
  updateProfile: async (profileData) => {
    const response = await api.put('/api/profile', profileData);
    return response.data;
  },

  getUserInfo: async () => {
    logApiCall('GET', '/api/me');
    try {
      const response = await api.get('/api/me');
      logApiCall('GET', '/api/me', response.data);
      return response.data;
    } catch (error) {
      logApiCall('GET', '/api/me', null, error);
      throw error;
    }
  },

  getProfile: async (userId) => {
    // Special case for "view"
    if (userId === 'view') {
      return api.get('/api/profile-views/analytics');
    }
    
    // Validate userId before making the request
    if (!userId || userId === 'undefined') {
      const error = new Error('Valid user ID is required');
      console.error('Invalid userId in getProfile:', userId);
      throw error;
    }
    
    // Ensure userId is a valid ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      const error = new Error('Invalid user ID format');
      console.error('Invalid userId format in getProfile:', userId);
      throw error;
    }
    
    console.log(`Getting profile for user: ${userId}`);
    try {
      const response = await api.get(`/api/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },
  
  updateLocation: async (latitude, longitude) => {
    const response = await api.put('/api/location', { latitude, longitude });
    // Emit location update via Socket.IO
    socketManager.emit('update_location', { latitude, longitude });
    return response.data;
  },
  
  // Update privacy settings
  updatePrivacySettings: async (privacySettings) => {
    const response = await api.put('/api/privacy-settings', { privacy: privacySettings });
    return response.data;
  },
  
  // Block a user
  blockUser: async (userId) => {
    const response = await api.post(`/api/users/${userId}/block`);
    return response.data;
  },

  // Get app settings
  getSettings: async () => {
    const response = await api.get('/api/settings');
    return response.data;
  },

  // Update app settings
  updateSettings: async (settings) => {
    const response = await api.put('/api/settings', settings);
    return response.data;
  },

  // Get profile view analytics
  getProfileViewAnalytics: async (period = 'month') => {
    const response = await api.get(`/api/profile-views/analytics?period=${period}`);
    return response.data;
  },

  // Get profile viewers
  getProfileViewers: async (options = {}) => {
    const { limit = 10, page = 1, period = 'month' } = options;
    const url = `/api/profile-views/viewers?limit=${limit}&page=${page}&period=${period}`;
    const response = await api.get(url);
    return response.data;
  },

  // Update profile view privacy
  updateProfileViewPrivacy: async (visibility) => {
    const response = await api.put('/api/settings/profile-view-privacy', { visibility });
    return response.data;
  },

  // Get profile view activity
  getProfileViewActivity: async (options = {}) => {
    const { limit = 10, page = 1 } = options;
    const url = `/api/profile-views/activity?limit=${limit}&page=${page}`;
    const response = await api.get(url);
    return response.data;
  },

  // Endorse a user's skill
  endorseSkill: async (userId, skillName) => {
    const response = await api.post(`/api/users/${userId}/endorse`, { skillName });
    return response.data;
  },

  // Write a recommendation for a user
  writeRecommendation: async (userId, recommendationData) => {
    const response = await api.post(`/api/users/${userId}/recommend`, recommendationData);
    return response.data;
  },

  // Manage pending recommendations
  manageRecommendation: async (recommendationId, action) => {
    const response = await api.put(`/api/recommendations/${recommendationId}`, action);
    return response.data;
  }
};

// Post endpoints
const postService = {
  createPost: async (formData) => {
    const response = await api.post('/api/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getPosts: async (options = {}) => {
    const { limit = 10, before, after } = options;
    let url = '/api/posts';
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (before) params.append('before', before);
    if (after) params.append('after', after);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { posts: [] };
    }
  },
  
  getPosts: async (options = {}) => {
    const { limit = 10, before, after } = options;
    let url = '/api/posts';
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (before) params.append('before', before);
    if (after) params.append('after', after);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },
  
  likePost: async (postId, reaction = 'like') => {
    const response = await api.post(`/api/posts/${postId}/react`, { reaction });
    return response.data;
  },
  
  commentOnPost: async (postId, content) => {
    const response = await api.post(`/api/posts/${postId}/comments`, { content });
    return response.data;
  },
  
  getPostComments: async (postId, limit = 10) => {
    const response = await api.get(`/api/posts/${postId}/comments?limit=${limit}`);
    return response.data;
  },
  
  sharePost: async (postId, content = '') => {
    const response = await api.post(`/api/posts/${postId}/share`, { content });
    return response.data;
  },
  
  deletePost: async (postId) => {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  }
};

// Story endpoints
const storyService = {
  createStory: async (formData) => {
    const response = await api.post('/api/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getStories: async () => {
    const response = await api.get('/api/stories');
    return response.data;
  },
  
  viewStory: async (storyId) => {
    const response = await api.post(`/api/stories/${storyId}/view`);
    return response.data;
  },
  
  reactToStory: async (storyId, reaction) => {
    const response = await api.post(`/api/stories/${storyId}/react`, { reaction });
    return response.data;
  },
  
  replyToStory: async (storyId, message) => {
    const response = await api.post(`/api/stories/${storyId}/reply`, { message });
    return response.data;
  },
  
  // Get story highlights
  getHighlights: async (userId) => {
    const response = await api.get(`/api/highlights/${userId}`);
    return response.data;
  },
  
  // Create a highlight from stories
  createHighlight: async (title, stories) => {
    const response = await api.post('/api/highlights', { title, stories });
    return response.data;
  }
};

// Chat endpoints
const chatService = {
  getChats: async () => {
    const response = await api.get('/api/chats');
    return response.data;
  },

  createChat: async (participantId, type = 'direct', name = '', description = '') => {
    const response = await api.post('/api/chats', {
      participantId,
      type,
      name,
      description
    });
    return response.data;
  },

  getMessages: async (chatId, options = {}) => {
    const { limit, before, after, lastMessageId } = options;
    let url = `/api/chats/${chatId}/messages`;
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (before) params.append('before', before);
    if (after) params.append('after', after);
    if (lastMessageId) params.append('lastMessageId', lastMessageId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  sendMessage: async (chatId, messageData) => {
    const response = await api.post(`/api/chats/${chatId}/messages`, messageData);
    
    // Enhance with Socket.IO for real-time delivery
    socketManager.emit('new_message', {
      ...response.data,
      chatId
    });
    
    return response.data;
  },

  sendMessageWithAttachment: async (chatId, formData, config = {}) => {
    // Make sure we're using the right content type for files
    const customConfig = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    };
    
    try {
      const response = await api.post(`/api/chats/${chatId}/messages`, formData, customConfig);
      
      // Notify about new message with attachment via socket
      socketManager.emit('new_message', {
        ...response.data,
        chatId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending message with attachment:', error);
      throw error;
    }
  },
  
  // Reply to a message
  replyToMessage: async (chatId, messageId, content, messageType = 'text', attachment = null) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('messageType', messageType);
      formData.append('replyTo', messageId);
      
      if (attachment) {
        formData.append('media', attachment);
      }
      
      const response = await api.post(`/api/chats/${chatId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      socketManager.emit('new_message', {
        ...response.data,
        chatId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error replying to message:', error);
      throw error;
    }
  },
  
  // Delete a message
  deleteMessage: async (chatId, messageId) => {
    try {
      const response = await api.delete(`/api/chats/${chatId}/messages/${messageId}`);
      
      // Notify deletion via socket
      socketManager.emit('message_deleted', {
        chatId,
        messageId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },
  
  // React to a message
  reactToMessage: async (chatId, messageId, reaction) => {
    try {
      const response = await api.post(`/api/chats/${chatId}/messages/${messageId}/react`, { reaction });
      
      // Notify reaction via socket
      socketManager.emit('message_reaction', {
        chatId,
        messageId,
        reaction,
        userId: response.data.userId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error reacting to message:', error);
      throw error;
    }
  },
  
  // Remove reaction from a message
  removeReaction: async (chatId, messageId) => {
    try {
      const response = await api.delete(`/api/chats/${chatId}/messages/${messageId}/react`);
      
      // Notify reaction removal via socket
      socketManager.emit('reaction_removed', {
        chatId,
        messageId,
        userId: response.data.userId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  },
  
  // Start an audio call
  startAudioCall: async (chatId) => {
    try {
      const response = await api.post(`/api/calls/${chatId}/audio`);
      
      // Notify call via socket
      socketManager.emit('call_started', {
        chatId,
        callId: response.data.callId,
        type: 'audio',
        initiator: response.data.initiator
      });
      
      return response.data;
    } catch (error) {
      console.error('Error starting audio call:', error);
      throw error;
    }
  },
  
  // Start a video call
  startVideoCall: async (chatId) => {
    try {
      const response = await api.post(`/api/calls/${chatId}/video`);
      
      // Notify call via socket
      socketManager.emit('call_started', {
        chatId,
        callId: response.data.callId,
        type: 'video',
        initiator: response.data.initiator
      });
      
      return response.data;
    } catch (error) {
      console.error('Error starting video call:', error);
      throw error;
    }
  },
  
  // Accept a call
  acceptCall: async (callId) => {
    try {
      const response = await api.post(`/api/calls/${callId}/accept`);
      
      // Notify call acceptance via socket
      socketManager.emit('call_accepted', {
        callId,
        acceptedBy: response.data.acceptedBy
      });
      
      return response.data;
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  },
  
  // Decline a call
  declineCall: async (callId) => {
    try {
      const response = await api.post(`/api/calls/${callId}/decline`);
      
      // Notify call decline via socket
      socketManager.emit('call_declined', {
        callId,
        declinedBy: response.data.declinedBy
      });
      
      return response.data;
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  },
  
  // End a call
  endCall: async (callId) => {
    try {
      const response = await api.post(`/api/calls/${callId}/end`);
      
      // Notify call end via socket
      socketManager.emit('call_ended', {
        callId,
        endedBy: response.data.endedBy
      });
      
      return response.data;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  },
  
  // Create a poll in a chat
  createPoll: async (chatId, pollData) => {
    try {
      const response = await api.post(`/api/chats/${chatId}/polls`, pollData);
      return response.data;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }
};

// Network endpoints
const networkService = {
  sendConnectionRequest: async (userId) => {
    const response = await api.post('/api/connections/request', { targetUserId: userId });
    return response.data;
  },

  acceptConnection: async (userId) => {
    const response = await api.post('/api/connections/accept', { senderUserId: userId });
    return response.data;
  },

  declineConnection: async (userId) => {
    const response = await api.post('/api/connections/decline', { senderUserId: userId });
    return response.data;
  },

  getConnections: async (type = 'all') => {
    const response = await api.get(`/api/network/connections?type=${type}`);
    return response.data;
  },

  getConnectionRequests: async () => {
    const response = await api.get('/api/network/connection-requests');
    return response.data;
  },

  followUser: async (userId) => {
    const response = await api.post(`/api/users/${userId}/follow`);
    return response.data;
  },
  
  getNearbyProfessionals: async (distance = 10) => {
    const response = await api.get(`/api/network/nearby?distance=${distance}`);
    return response.data;
  },

  getProfessionalSuggestions: async (options = {}) => {
    const { industry, skills, limit } = options;
    
    let url = '/api/network/suggestions';
    const params = new URLSearchParams();
    
    if (industry) params.append('industry', industry);
    if (skills) params.append('skills', skills);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  // Location-based networking
  getMapUsers: async (options = {}) => {
    const { 
      latitude, longitude, radius, 
      industries, skills, 
      availableForMeeting, availableForHiring, lookingForWork,
      page, limit
    } = options;
    
    let url = '/api/network/map';
    const params = new URLSearchParams();
    
    if (latitude) params.append('latitude', latitude);
    if (longitude) params.append('longitude', longitude);
    if (radius) params.append('radius', radius);
    if (industries) params.append('industries', industries);
    if (skills) params.append('skills', skills);
    if (availableForMeeting) params.append('availableForMeeting', availableForMeeting);
    if (availableForHiring) params.append('availableForHiring', availableForHiring);
    if (lookingForWork) params.append('lookingForWork', lookingForWork);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  updateLocationStatus: async (data) => {
    const response = await api.put('/api/network/location-status', data);
    return response.data;
  },

  // Request an in-person meeting
  requestMeeting: async (targetUserId, meetingData) => {
    const response = await api.post('/api/network/meeting-request', {
      targetUserId,
      ...meetingData
    });
    return response.data;
  },

  // Respond to a meeting request
  respondToMeeting: async (meetingId, status, alternativeData = {}) => {
    const response = await api.put(`/api/network/meeting-request/${meetingId}`, {
      status,
      ...alternativeData
    });
    return response.data;
  },

  // Get user's meetings
  getMeetings: async (options = {}) => {
    const { status, type, page, limit } = options;
    let url = '/api/network/meetings';
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};

// Profile View endpoints (LinkedIn style)
const profileViewService = {
  // Record a profile view
  recordProfileView: async (profileId) => {
    if (!profileId || profileId === 'view' || !/^[0-9a-fA-F]{24}$/.test(profileId)) {
      console.warn('Skipping profile view recording for invalid ID:', profileId);
      return { success: false, skipped: true };
    }
    
    try {
      const response = await api.post('/api/profile-views', { profileId });
      return response.data;
    } catch (error) {
      console.error('Error recording profile view:', error);
      throw error;
    }
  },
  
  // Get users who viewed your profile
  getProfileViewers: async (options = {}) => {
    const { limit = 10, page = 1, period = 'month' } = options;
    
    let url = '/api/profile-views/viewers';
    const params = new URLSearchParams();
    
    params.append('limit', limit);
    params.append('page', page);
    params.append('period', period);
    
    const response = await api.get(`${url}?${params.toString()}`);
    return response.data;
  },
  
  // Get analytics about your profile views
  getProfileViewAnalytics: async (period = 'month') => {
    const response = await api.get(`/api/profile-views/analytics?period=${period}`);
    return response.data;
  },
  
  // Update your profile view privacy settings
  updateProfileViewPrivacy: async (visibility) => {
    const response = await api.put('/api/settings/profile-view-privacy', { visibility });
    return response.data;
  },
  
  // Get your profile view activity (who you viewed)
  getProfileViewActivity: async (options = {}) => {
    const { limit = 10, page = 1 } = options;
    
    let url = '/api/profile-views/activity';
    const params = new URLSearchParams();
    
    params.append('limit', limit);
    params.append('page', page);
    
    const response = await api.get(`${url}?${params.toString()}`);
    return response.data;
  }
};

// Event endpoints
const eventService = {
  // Create an event
  createEvent: async (eventData) => {
    const formData = new FormData();
    
    // Add regular fields
    for (const [key, value] of Object.entries(eventData)) {
      if (key !== 'coverImage') {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    }
    
    // Add cover image if exists
    if (eventData.coverImage instanceof File) {
      formData.append('coverImage', eventData.coverImage);
    }
    
    const response = await api.post('/api/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  // Create a recurring event
  createRecurringEvent: async (eventData) => {
    const formData = new FormData();
    
    // Add regular fields
    for (const [key, value] of Object.entries(eventData)) {
      if (key !== 'coverImage') {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    }
    
    // Add cover image if exists
    if (eventData.coverImage instanceof File) {
      formData.append('coverImage', eventData.coverImage);
    }
    
    const response = await api.post('/api/events/recurrent', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  // Get events with filters
  getEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filters)) {
      params.append(key, value);
    }
    
    const response = await api.get(`/api/events?${params.toString()}`);
    return response.data;
  },

  // Respond to an event (going, interested, not going)
  respondToEvent: async (eventId, status, message = '') => {
    const response = await api.post(`/api/events/${eventId}/respond`, { 
      status,
      message
    });
    return response.data;
  },

  // Get event attendees
  getEventAttendees: async (eventId, options = {}) => {
    const { status, page = 1, limit = 20, search } = options;
    
    let url = `/api/events/${eventId}/attendees`;
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  // Invite connections to an event
  inviteToEvent: async (eventId, userIds, message = '') => {
    const response = await api.post(`/api/events/${eventId}/invite`, {
      userIds,
      message
    });
    return response.data;
  },

  // Check in to an event
  checkInToEvent: async (eventId, data = {}) => {
    const response = await api.post(`/api/events/${eventId}/checkin`, data);
    return response.data;
  },

  // Get event analytics (for organizers)
  getEventAnalytics: async (eventId) => {
    const response = await api.get(`/api/events/${eventId}/analytics`);
    return response.data;
  },

  // Get nearby events
  getNearbyEvents: async (options = {}) => {
    const { 
      latitude, longitude, radius, 
      startDate, endDate, categories,
      page, limit
    } = options;
    
    let url = '/api/map/events';
    const params = new URLSearchParams();
    
    if (latitude) params.append('latitude', latitude);
    if (longitude) params.append('longitude', longitude);
    if (radius) params.append('radius', radius);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (categories) params.append('categories', categories);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};

// Job endpoints
const jobService = {
  // Create a job posting
  createJob: async (jobData) => {
    const response = await api.post('/api/jobs', jobData);
    return response.data;
  },
  
  // Get job listings with filters
  getJobs: async (filters = {}) => {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filters)) {
      params.append(key, value);
    }
    
    const response = await api.get(`/api/jobs?${params.toString()}`);
    return response.data;
  },

  // Get nearby jobs
  getNearbyJobs: async (options = {}) => {
    const { 
      latitude, longitude, radius, 
      jobTypes, experienceLevels, industries, 
      remote, page, limit 
    } = options;
    
    let url = '/api/map/jobs';
    const params = new URLSearchParams();
    
    if (latitude) params.append('latitude', latitude);
    if (longitude) params.append('longitude', longitude);
    if (radius) params.append('radius', radius);
    if (jobTypes) params.append('jobTypes', jobTypes);
    if (experienceLevels) params.append('experienceLevels', experienceLevels);
    if (industries) params.append('industries', industries);
    if (remote) params.append('remote', remote);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};

// Company endpoints

const companyService = {
  // Create a company profile
  createCompany: async (companyData) => {
    const formData = new FormData();
    
    // Process regular fields
    for (const [key, value] of Object.entries(companyData)) {
      if (!['logo', 'coverImage'].includes(key)) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    }
    
    // Add logo and cover image
    if (companyData.logo instanceof File) {
      formData.append('logo', companyData.logo);
    }
    
    if (companyData.coverImage instanceof File) {
      formData.append('coverImage', companyData.coverImage);
    }
    
    const response = await api.post('/api/companies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  // Get company details
  getCompany: async (companyId) => {
    const response = await api.get(`/api/companies/${companyId}`);
    return response.data;
  }
};

// Discovery endpoints
const discoveryService = {
  // Get personalized discovery dashboard
  getDiscoveryDashboard: async () => {
    const response = await api.get('/api/discover');
    return response.data;
  },

  // Get content feed with filters
  getContentFeed: async (options = {}) => {
    const { 
      type, filter, page, limit, location 
    } = options;

    let url = '/api/content/feed';
    const params = new URLSearchParams();
    
    if (type) params.append('type', type);
    if (filter) params.append('filter', filter);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (location) params.append('location', location);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  // Get trending content
  getTrending: async (options = {}) => {
    const { period, category, location } = options;
    
    let url = '/api/trending';
    const params = new URLSearchParams();
    
    if (period) params.append('period', period);
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  // Search with advanced filters
  search: async (query, options = {}) => {
    const { type, filter, page, limit } = options;
    
    let url = '/api/search';
    const params = new URLSearchParams();
    
    params.append('query', query);
    if (type) params.append('type', type);
    if (filter) params.append('filter', typeof filter === 'object' ? JSON.stringify(filter) : filter);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};

// Portfolio endpoints
const portfolioService = {
  // Create a project
  createProject: async (projectData) => {
    try {
      // Check if we already have FormData
      if (projectData instanceof FormData) {
        console.log('Using existing FormData - checking for title field');
        
        // Ensure we have a title field
        const titleValue = projectData.get('title');
        console.log('Title value in FormData:', titleValue);
        
        // If no title found, explicitly check for it to provide a better error
        if (!titleValue || titleValue.trim() === '') {
          throw new Error('Title field is missing in FormData');
        }
      } else {
        console.log('Creating new FormData from object');
        // We should never reach here since we're passing FormData from the component
      }
      
      // Debug: Log all entries in the FormData
      if (projectData instanceof FormData) {
        console.log('FormData contents before sending to API:');
        const entries = [...projectData.entries()];
        entries.forEach(([key, value]) => {
          console.log(`${key}: ${typeof value === 'string' ? value : '[File or Object]'}`);
        });
      }
      
      // Make the API request to the correct endpoint: /api/projects
      console.log('Sending request to:', '/api/projects');
      const response = await api.post('/api/projects', projectData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in createProject API call:', error);
      
      // Enhanced error logging for debugging
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      }
      
      throw error;
    }
  },
  // Add these to your api.js file in the portfolioService object

// Delete a project
deleteProject: async (projectId) => {
  try {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    const response = await api.delete(`/api/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
},

// Delete an achievement 
deleteAchievement: async (achievementId) => {
  try {
    if (!achievementId) {
      throw new Error('Achievement ID is required');
    }
    
    const response = await api.delete(`/api/achievements/${achievementId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting achievement:', error);
    throw error;
  }
},

// Delete a streak
deleteStreak: async (streakId) => {
  try {
    if (!streakId) {
      throw new Error('Streak ID is required');
    }
    
    const response = await api.delete(`/api/streaks/${streakId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting streak:', error);
    throw error;
  }
},
  // Get user projects - FIXED to match server implementation
  getUserProjects: async (userId, options = {}) => {
    const { limit = 10, page = 1 } = options;
    
    let url = `/api/projects`; // Changed from user-specific endpoint to general projects endpoint
    const params = new URLSearchParams();
    
    params.append('userId', userId); // Add userId as a query parameter instead
    params.append('page', page);
    params.append('limit', limit);
    
    try {
      const response = await api.get(`${url}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return { items: [], total: 0 };
    }
  },

  // Get user achievements - FIXED to match server implementation
  getUserAchievements: async (userId, options = {}) => {
    const { limit = 10, page = 1 } = options;
    
    let url = `/api/achievements`; // Changed from user-specific endpoint to general achievements endpoint
    const params = new URLSearchParams();
    
    params.append('userId', userId); // Add userId as a query parameter instead
    params.append('page', page);
    params.append('limit', limit);
    
    try {
      const response = await api.get(`${url}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return { items: [], total: 0 };
    }
  },

  // Get user streaks - FIXED to match server implementation
  getUserStreaks: async (userId, options = {}) => {
    const { limit = 10, page = 1, active } = options;
    
    let url = `/api/streaks`;  // Changed from user-specific endpoint to general streaks endpoint
    const params = new URLSearchParams();
    
    params.append('userId', userId); // Add userId as a query parameter instead
    params.append('page', page);
    params.append('limit', limit);
    if (active !== undefined) params.append('active', active);
    
    try {
      const response = await api.get(`${url}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user streaks:', error);
      return { items: [], total: 0 };
    }
  }
};

// Group endpoints
const groupService = {
  // Create a group
  createGroup: async (groupData) => {
    const formData = new FormData();
    
    // Process regular fields
    for (const [key, value] of Object.entries(groupData)) {
      if (key !== 'coverImage') {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    }
    
    // Add cover image if exists
    if (groupData.coverImage instanceof File) {
      formData.append('coverImage', groupData.coverImage);
    }
    
    const response = await api.post('/api/groups', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  // Join, leave, or request to join group
  manageGroupMembership: async (groupId, action, message = '') => {
    const response = await api.post(`/api/groups/${groupId}/membership`, {
      action,
      message
    });
    return response.data;
  },

  // Review membership requests (for admins)
  reviewMembershipRequest: async (groupId, userId, status) => {
    const response = await api.put(`/api/groups/${groupId}/requests/${userId}`, {
      status
    });
    return response.data;
  },

  // Create group post
  createGroupPost: async (groupId, postData) => {
    const formData = new FormData();
    
    // Process regular fields
    for (const [key, value] of Object.entries(postData)) {
      if (key !== 'media') {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    }
    
    // Add media files
    if (postData.media) {
      if (Array.isArray(postData.media)) {
        postData.media.forEach((file, index) => {
          formData.append(`media`, file);
        });
      } else {
        formData.append('media', postData.media);
      }
    }
    
    const response = await api.post(`/api/groups/${groupId}/posts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  // Get nearby groups
  getNearbyGroups: async (options = {}) => {
    const { 
      latitude, longitude, radius, 
      types, categories,
      page, limit
    } = options;
    
    let url = '/api/map/groups';
    const params = new URLSearchParams();
    
    if (latitude) params.append('latitude', latitude);
    if (longitude) params.append('longitude', longitude);
    if (radius) params.append('radius', radius);
    if (types) params.append('types', types);
    if (categories) params.append('categories', categories);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};

// Analytics endpoints
const analyticsService = {
  // Get network analytics
  getNetworkAnalytics: async (period = 'month') => {
    const response = await api.get(`/api/analytics/network?period=${period}`);
    return response.data;
  },

  // Get event analytics
  getEventAnalytics: async (period = 'year') => {
    const response = await api.get(`/api/analytics/events?period=${period}`);
    return response.data;
  }
};

// Location sharing endpoints
const locationService = {
  // Add this new method to your locationService object

// Continuous location update (every 30 seconds)
continuousLocationUpdate: async (locationData) => {
  try {
    const { latitude, longitude, accuracy, heading, speed } = locationData;
    
    // Validate required parameters
    if (!latitude || !longitude) {
      console.error('Continuous location update requires latitude and longitude');
      return { success: false, error: 'Missing required location data' };
    }
    
    const response = await api.post('/api/location/continuous-update', {
      latitude,
      longitude,
      accuracy,
      heading,
      speed
    });
    
    // Emit location update via Socket.IO if socket is available
    if (socketManager && socketManager.isConnected()) {
      socketManager.emit('update_location', { latitude, longitude });
    }
    
    return response.data;
  } catch (error) {
    console.error('Continuous location update error:', error);
    return { 
      success: false, 
      error: error.response?.data?.msg || error.message 
    };
  }
},

// Add the following to set up the update interval (can be called when app initializes)
startContinuousLocationUpdates: async (options = {}) => {
  const { 
    interval = 30000, // Default 30 seconds
    errorCallback,
    successCallback
  } = options;
  
  // Clear any existing interval
  if (window._locationUpdateInterval) {
    clearInterval(window._locationUpdateInterval);
  }
  
  // Store the update function
  const updateLocation = async () => {
    try {
      // Get current position
      if (!navigator.geolocation) {
        if (errorCallback) errorCallback('Geolocation not supported');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy, heading, speed } = position.coords;
          
          const result = await locationService.continuousLocationUpdate({
            latitude,
            longitude,
            accuracy,
            heading,
            speed
          });
          
          if (successCallback) successCallback(result);
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (errorCallback) errorCallback(error.message);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    } catch (error) {
      console.error('Error in continuous location update:', error);
      if (errorCallback) errorCallback(error.message);
    }
  };
  
  // Call immediately once
  updateLocation();
  
  // Set up the interval
  window._locationUpdateInterval = setInterval(updateLocation, interval);
  
  return {
    stop: () => {
      if (window._locationUpdateInterval) {
        clearInterval(window._locationUpdateInterval);
        window._locationUpdateInterval = null;
      }
    }
  };
},

stopContinuousLocationUpdates: () => {
  if (window._locationUpdateInterval) {
    clearInterval(window._locationUpdateInterval);
    window._locationUpdateInterval = null;
    return true;
  }
  return false;
},
  // Enable/disable real-time location sharing
  toggleLocationSharing: async (settings) => {
    const response = await api.post('/api/location/sharing', settings);
    return response.data;
  },

  // Update real-time location
  updateLocation: async (locationData) => {
    const response = await api.post('/api/location/update', locationData);
    return response.data;
  },

  // Get users with shared location
  getSharedLocationUsers: async () => {
    const response = await api.get('/api/location/shared-users');
    return response.data;
  }
};

// Webhook endpoints
const webhookService = {
  // Register webhook
  registerWebhook: async (webhookData) => {
    const response = await api.post('/api/webhooks', webhookData);
    return response.data;
  }
};

// Initialize socket connection if token exists
const token = localStorage.getItem('token');
if (token) {
  socketManager.connect(token);
}

// Export all services
export default {
  baseURL,
  socketManager,
  ...authService,
  ...profileService,
  ...postService,
  ...storyService,
  ...chatService,
  ...networkService,
  ...profileViewService,
  ...eventService,
  ...jobService,
  ...companyService,
  ...discoveryService,
  ...portfolioService,
  ...groupService,
  ...analyticsService,
  ...locationService,
  ...webhookService
};
