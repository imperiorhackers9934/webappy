import axios from 'axios';
import socketManager from './socketmanager';

// Determine API base URL from environment or default
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000"

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
    // Emit location update via Socket.IO
    socketManager.emit('update_location', { latitude, longitude });
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
  }
};

// Chat endpoints
// Updated chatService section for api.js with fixed media uploads and call support

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
  ...networkService
};