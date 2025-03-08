// frontend/src/services/socketManager.js
import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.eventHandlers = {};
    this.connectionStatus = 'DISCONNECTED';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.statusListeners = [];
    this.lastMessages = {};
    this.debug = true; // Always log for debugging
  }

  connect(token, url) {
    if (!token) {
      console.error('Cannot connect to Socket.IO: No authentication token provided');
      return;
    }

    // Determine server URL
    const serverUrl = url || this._getDefaultServerUrl();
    
    console.log(`Socket.IO: Connecting to ${serverUrl} with token: ${token.substring(0, 10)}...`);

    // Close existing connection if any
    this._cleanup();

    try {
      // Connect with authentication token
      this.socket = io(serverUrl, {
        auth: { token },
        query: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      // Setup basic event handlers
      this._setupEventHandlers();

      return this.socket;
    } catch (error) {
      console.error('Socket.IO: Connection error', error);
      this._updateStatus('ERROR');
      return null;
    }
  }

  _getDefaultServerUrl() {
    // Use environment variable if available
    if (window.env && window.env.SOCKET_URL) {
      return window.env.SOCKET_URL;
    }
    
    // Try to use the current API URL without the path
    try {
      // Get the base URL from your API
      const apiBase = "https://myapp-nt8s.onrender.com"; // Replace with your actual API base URL
      return apiBase;
    } catch (e) {
      console.error('Error constructing socket URL:', e);
    }

    // Otherwise construct from window location
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const host = window.location.hostname || 'localhost';
    const port = window.location.hostname === 'localhost' ? '3000' : '';
    
    return `${protocol}://${host}${port ? `:${port}` : ''}`;
  }

  _setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO: Connected successfully with ID:', this.socket.id);
      this._updateStatus('CONNECTED');
      this.reconnectAttempts = 0;
      
      // Re-register all event handlers
      Object.entries(this.eventHandlers).forEach(([event, handlers]) => {
        handlers.forEach(handler => {
          if (typeof handler._rawHandler === 'function') {
            // Use the raw handler function directly with socket.on
            this.socket.on(event, handler._rawHandler);
          }
        });
      });
      
      // Request initial data from server
      this.emit('client_ready', { timestamp: new Date().toISOString() });
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      this._updateStatus('ERROR');
      
      console.error(`Socket.IO: Connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, error.message);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Socket.IO: Maximum reconnection attempts reached');
      }
    });

    this.socket.on('disconnect', (reason) => {
      this._updateStatus('DISCONNECTED');
      console.log(`Socket.IO: Disconnected (${reason})`);
    });

    // Setup debug event for development
    this.socket.onAny((event, ...args) => {
      console.log(`Socket.IO [Event]: ${event}`, args);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._updateStatus('DISCONNECTED');
    }
  }

  _cleanup() {
    if (this.socket) {
      this.socket.off();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  _updateStatus(status) {
    this.connectionStatus = status;
    
    // Notify all status listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Socket.IO: Error in status listener', error);
      }
    });
  }

  // Register an event handler
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    // Create a wrapper function that will update lastMessages and call the handler
    const wrappedHandler = (data) => {
      console.log(`Socket.IO: Event ${event} received`, data);
      this.lastMessages[event] = data;
      handler(data);
    };
    
    // Store the original handler for reconnection
    wrappedHandler._rawHandler = wrappedHandler;
    
    // Add to our handlers list
    this.eventHandlers[event].push(wrappedHandler);
    
    // If socket exists, register with the socket
    if (this.socket) {
      console.log(`Socket.IO: Registering handler for ${event}`);
      this.socket.on(event, wrappedHandler);
    }
    
    // Return unsubscribe function
    return () => this.off(event, wrappedHandler);
  }

  // Register a handler that directly uses socket.io's API
  // This is helpful for debugging
  rawOn(event, handler) {
    if (this.socket) {
      console.log(`Socket.IO: Directly registering raw handler for ${event}`);
      this.socket.on(event, handler);
      
      // Return function to remove listener
      return () => {
        if (this.socket) {
          this.socket.off(event, handler);
        }
      };
    }
    
    return () => {}; // No-op if no socket
  }

  // Remove an event handler
  off(event, handler) {
    if (!this.eventHandlers[event]) {
      return;
    }
    
    // Remove from our handler list
    this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    
    // Remove from socket if it exists
    if (this.socket) {
      this.socket.off(event, handler._rawHandler || handler);
    }
  }

  // Emit an event
  emit(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`Socket.IO: Cannot emit "${event}" - not connected`);
      return false;
    }
    
    try {
      console.log(`Socket.IO: Emitting event ${event}`, data);
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Socket.IO: Error emitting "${event}"`, error);
      return false;
    }
  }

  // Subscribe to status changes
  onStatusChange(listener) {
    this.statusListeners.push(listener);
    
    // Call immediately with current status
    listener(this.connectionStatus);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  // Join a chat room
  joinChat(chatId) {
    console.log(`Socket.IO: Joining chat ${chatId}`);
    return this.emit('join_chat', { chatId });
  }
  
  // Leave a chat room
  leaveChat(chatId) {
    console.log(`Socket.IO: Leaving chat ${chatId}`);
    return this.emit('leave_chat', { chatId });
  }
  
  // Send a new message
  sendMessage(chatId, message) {
    return this.emit('send_message', { chatId, ...message });
  }
  
  // Mark a message as read
  markMessageRead(messageId, chatId) {
    return this.emit('read_message', { messageId, chatId });
  }
  
  // Send typing indicator
  sendTypingIndicator(chatId, isTyping) {
    return this.emit('typing', { chatId, isTyping });
  }
  
  // Get current connection status
  getStatus() {
    return this.connectionStatus;
  }

  // Check if socket is currently connected
  isConnected() {
    return this.socket !== null && this.socket.connected && this.connectionStatus === 'CONNECTED';
  }

  // Get the last received message for an event
  getLastMessage(event) {
    return this.lastMessages[event] || null;
  }
  // Add these methods to your SocketManager class
startCall(chatId, callType, recipient) {
  return this.emit('call_started', {
    chatId,
    callType,
    recipient
  });
}

sendIceCandidate(callId, candidate, targetUserId) {
  return this.emit('call_ice_candidate', {
    callId,
    candidate,
    targetUserId
  });
}

sendSdpOffer(callId, sdp, targetUserId) {
  return this.emit('call_sdp_offer', {
    callId,
    sdp,
    targetUserId
  });
}

sendSdpAnswer(callId, sdp, targetUserId) {
  return this.emit('call_sdp_answer', {
    callId,
    sdp,
    targetUserId
  });
}
  
  // Force a reconnection
  forceReconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      setTimeout(() => {
        this.connect(token);
      }, 1000);
    }
  }
}

// Create a singleton instance
const socketManager = new SocketManager();

export default socketManager;
