import axios from 'axios';
import { io } from 'socket.io-client';

const baseURL = 'http://localhost:3000';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Socket.IO Connection Management
class SocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
  }

  connect(token) {
    // Disconnect existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    // Construct Socket.IO connection URL
    const socketURL = this.getSocketURL();

    // Establish connection with authentication
    this.socket = io(socketURL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Setup connection event listeners
    this.setupEventListeners();

    // Reattach any previously registered event listeners
    this.reattachEventListeners();

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocketURL() {
    // Use the environment variable directly if available
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    
    // Otherwise construct it properly
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || 'localhost';
    const port = '3000'; // Your server port
    
    return `${protocol}//${hostname}:${port}`;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connection established');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      
      // Automatic reconnection logic
      if (reason === 'io server disconnect') {
        // Reconnect manually if server forcibly disconnected
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      
      // Increment reconnect attempts
      this.reconnectAttempts++;
      
      // Optional: Implement more advanced reconnection strategy
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        // Optionally trigger UI notification or fallback mechanism
      }
    });
  }

  // Subscribe to specific events
  on(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
    
    // Store listener for potential reattachment
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  // Emit events to the server
  emit(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }

  // Reattach event listeners when reconnecting
  reattachEventListeners() {
    this.eventListeners.forEach((callbacks, eventName) => {
      callbacks.forEach(callback => {
        this.socket.on(eventName, callback);
      });
    });
  }
}

// Instantiate the Socket Manager
const socketManager = new SocketManager();

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

  checkAuthProvider: async (identifier) => {
    const payload = {};
    if (identifier.includes('@')) {
      payload.email = identifier;
    } else {
      payload.phoneNumber = identifier;
    }
    const response = await api.post('/auth/check-provider', payload);
    return response.data;
  },
  
  setup2FA: async (method) => {
    const response = await api.post('/api/auth/2fa/setup', { method });
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
  }
};

// Profile endpoints
const profileService = {
  updateProfile: async (profileData) => {
    const response = await api.put('/api/profile', profileData);
    return response.data;
  },

  getProfile: async (userId) => {
    const response = await api.get(`/api/users/${userId}/profile`);
    return response.data;
  },
  
  updateLocation: async (latitude, longitude) => {
    const response = await api.put('/api/location', { latitude, longitude });
    return response.data;
  },

  updatePrivacySettings: async (privacySettings) => {
    const response = await api.put('/api/privacy-settings', { privacy: privacySettings });
    return response.data;
  }
};

// Chat endpoints with Socket.IO integration
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
    try {
      // Validate inputs
      if (!chatId) {
        throw new Error('Chat ID is required');
      }
      
      const response = await api.post(`/api/chats/${chatId}/messages`, messageData);
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid server response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Send Message API Error:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Server Response:', error.response.data);
        console.error('Server Status:', error.response.status);
        console.error('Server Headers:', error.response.headers);
      }
      
      throw error;
    }
  },

  sendMessageWithAttachment: async (chatId, formData) => {
    try {
      // Validate inputs
      if (!chatId) {
        throw new Error('Chat ID is required');
      }
      
      const response = await api.post(`/api/chats/${chatId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid server response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Send Message with Attachment API Error:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Server Response:', error.response.data);
        console.error('Server Status:', error.response.status);
        console.error('Server Headers:', error.response.headers);
      }
      
      throw error;
    }
  },

  // Subscribe to real-time message events
  onMessageReceived: (callback) => {
    socketManager.on('new_message', callback);
  },

  startCall: async (chatId, callType) => {
    if (!['audio', 'video'].includes(callType)) {
      throw new Error('Invalid call type. Must be "audio" or "video".');
    }
    
    // Emit call start via Socket.IO
    socketManager.emit('start_call', { chatId, callType });
    
    const response = await api.post(`/api/chats/${chatId}/call`, { callType });
    return response.data;
  },

  // Listen for incoming calls
  onIncomingCall: (callback) => {
    socketManager.on('incoming_call', callback);
  },

  createPoll: async (chatId, pollData) => {
    const response = await api.post(`/api/chats/${chatId}/polls`, pollData);
    return response.data;
  },

  voteOnPoll: async (chatId, pollId, optionIndex) => {
    // Emit poll vote via Socket.IO
    socketManager.emit('vote_on_poll', {
      chatId,
      pollId,
      optionIndex
    });
    
    const response = await api.post(`/api/chats/${chatId}/polls/${pollId}/vote`, {
      optionIndex
    });
    return response.data;
  }
};

// Network endpoints
const networkService = {
  updateLocation: async (latitude, longitude) => {
    const response = await api.put('/api/location', { latitude, longitude });
    
    // Emit location update via Socket.IO
    socketManager.emit('update_location', { latitude, longitude });
    
    return response.data;
  },

  getNearbyProfessionals: async (distance = 10) => {
    const response = await api.get(`/api/network/nearby?distance=${distance}`);
    return response.data;
  },

  sendConnectionRequest: async (userId) => {
    const response = await api.post('/api/connections/request', { targetUserId: userId });
    
    // Emit connection request via Socket.IO
    socketManager.emit('send_connection_request', { targetUserId: userId });
    
    return response.data;
  },

  // Listen for connection request events
  onConnectionRequest: (callback) => {
    socketManager.on('new_connection_request', callback);
  },

  acceptConnection: async (userId) => {
    const response = await api.post('/api/connections/accept', { senderUserId: userId });
    
    // Emit connection acceptance via Socket.IO
    socketManager.emit('accept_connection', { senderUserId: userId });
    
    return response.data;
  },

  declineConnection: async (userId) => {
    const response = await api.post('/api/connections/decline', { senderUserId: userId });
    
    // Emit connection decline via Socket.IO
    socketManager.emit('decline_connection', { senderUserId: userId });
    
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
    
    // Emit follow event via Socket.IO
    socketManager.emit('follow_user', { userId });
    
    return response.data;
  },

  blockUser: async (userId) => {
    const response = await api.post(`/api/users/${userId}/block`);
    
    // Emit block event via Socket.IO
    socketManager.emit('block_user', { userId });
    
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

  searchProfessionals: async (query, filters = {}) => {
    const { industry, skills, location, distance, page, limit } = filters;
    
    let url = `/api/search/professionals?q=${encodeURIComponent(query)}`;
    const params = new URLSearchParams();
    
    if (industry) params.append('industry', industry);
    if (skills) params.append('skills', skills);
    if (location) params.append('location', location);
    if (distance) params.append('distance', distance);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};

// Story and Highlight endpoints
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

  reportStory: async (storyId, reason, description = '') => {
    const response = await api.post(`/api/stories/${storyId}/report`, { reason, description });
    return response.data;
  },

  // Highlight endpoints
  createHighlight: async (highlightData) => {
    const response = await api.post('/api/highlights', highlightData);
    return response.data;
  },

  getUserHighlights: async (userId) => {
    const response = await api.get(`/api/highlights/${userId}`);
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

  getFeed: async (page = 1, limit = 10, filter = '') => {
    let url = `/api/posts/feed?page=${page}&limit=${limit}`;
    if (filter) url += `&filter=${filter}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getUserPosts: async (userId, page = 1, limit = 10) => {
    const response = await api.get(`/api/users/${userId}/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPost: async (postId, commentPage = 1, commentLimit = 20) => {
    const response = await api.get(
      `/api/posts/${postId}?commentPage=${commentPage}&commentLimit=${commentLimit}`
    );
    return response.data;
  },

  reactToPost: async (postId, reaction) => {
    const response = await api.post(`/api/posts/${postId}/react`, { reaction });
    return response.data;
  },

  addComment: async (postId, commentData) => {
    const response = await api.post(`/api/posts/${postId}/comments`, commentData);
    return response.data;
  },

  likeComment: async (postId, commentId) => {
    const response = await api.post(`/api/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },

  bookmarkPost: async (postId, collectionName = '') => {
    const response = await api.post(`/api/posts/${postId}/bookmark`, { collectionName });
    return response.data;
  },

  sharePost: async (postId, content = '', visibility = 'public') => {
    const response = await api.post(`/api/posts/${postId}/share`, { content, visibility });
    return response.data;
  },

  reportPost: async (postId, reason, description = '') => {
    const response = await api.post(`/api/posts/${postId}/report`, { reason, description });
    return response.data;
  }
};

// Bookmark endpoints
const bookmarkService = {
  getCollections: async () => {
    const response = await api.get('/api/bookmarks/collections');
    return response.data;
  },

  createCollection: async (name, description = '', privacy = 'private') => {
    const response = await api.post('/api/bookmarks/collections', {
      name, description, privacy
    });
    return response.data;
  },

  updateCollection: async (currentName, name, description, privacy) => {
    const response = await api.put(`/api/bookmarks/collections/${currentName}`, {
      name, description, privacy
    });
    return response.data;
  },

  deleteCollection: async (name) => {
    const response = await api.delete(`/api/bookmarks/collections/${name}`);
    return response.data;
  },

  getCollectionItems: async (name, page = 1, limit = 20) => {
    const response = await api.get(
      `/api/bookmarks/collections/${name}/items?page=${page}&limit=${limit}`
    );
    return response.data;
  }
};

// Event endpoints
const eventService = {
  createEvent: async (formData) => {
    const response = await api.post('/api/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getEvents: async (options = {}) => {
    const {
      category, startDate, endDate, location, distance,
      lat, lng, tags, page = 1, limit = 10
    } = options;
    
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (location) params.append('location', location);
    if (distance && lat && lng) {
      params.append('distance', distance);
      params.append('lat', lat);
      params.append('lng', lng);
    }
    if (tags) params.append('tags', tags);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/api/events?${params.toString()}`);
    return response.data;
  }
};

// Podcast endpoints
const podcastService = {
  createPodcast: async (formData) => {
    const response = await api.post('/api/podcasts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Job endpoints
const jobService = {
  createJob: async (jobData) => {
    const response = await api.post('/api/jobs', jobData);
    return response.data;
  }
};

// Portfolio system endpoints
const portfolioService = {
  // Project endpoints
  createProject: async (formData) => {
    const response = await api.post('/api/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Streak endpoints
  createStreak: async (streakData) => {
    const response = await api.post('/api/streaks', streakData);
    return response.data;
  },

  // Achievement endpoints
  createAchievement: async (formData) => {
    const response = await api.post('/api/achievements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Company endpoints
const companyService = {
  createCompany: async (formData) => {
    const response = await api.post('/api/companies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Discovery endpoints
const discoveryService = {
  getDiscoveryDashboard: async () => {
    const response = await api.get('/api/discover');
    return response.data;
  }
};

// Initialize socket connection if token exists
const token = localStorage.getItem('token');
if (token) {
  socketManager.connect(token);
}

export default {
  baseURL,
  socketManager,
  socket: socketManager.socket,
  ...authService,
  ...profileService,
  ...chatService,
  ...networkService,
  ...storyService,
  ...postService,
  ...bookmarkService,
  ...eventService,
  ...podcastService,
  ...jobService,
  ...portfolioService,
  ...companyService,
  ...discoveryService
};