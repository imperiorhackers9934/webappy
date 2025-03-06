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
    this.debug = process.env.NODE_ENV === 'development';
  }

  connect(token, url) {
    if (!token) {
      console.error('Cannot connect to Socket.IO: No authentication token provided');
      return;
    }

    // Determine server URL
    const serverUrl = url || this._getDefaultServerUrl();
    
    if (this.debug) {
      console.log(`Socket.IO: Connecting to ${serverUrl} with token: ${token.substring(0, 10)}...`);
    }

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
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }

    // Otherwise construct from window location
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const host = window.location.hostname || 'localhost';
    const port = import.meta.env.VITE_SOCKET_PORT || '3000';
    
    return `${protocol}://${host}:${port}`;
  }

  _setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this._updateStatus('CONNECTED');
      this.reconnectAttempts = 0;
      
      if (this.debug) {
        console.log('Socket.IO: Connected successfully with ID:', this.socket.id);
      }
      
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
      
      if (this.debug) {
        console.log(`Socket.IO: Disconnected (${reason})`);
      }
    });

    // Setup debug event for development
    if (this.debug) {
      this.socket.onAny((event, ...args) => {
        console.log(`Socket.IO [Event]: ${event}`, args);
      });
    }
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
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    } else {
      this.eventHandlers[event] = [handler];
    }
    
    // If socket exists, register the handler directly
    if (this.socket) {
      this.socket.on(event, (data) => {
        this.lastMessages[event] = data;
        handler(data);
      });
    }
    
    // Return unsubscribe function
    return () => {
      if (this.eventHandlers[event]) {
        this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
      }
    };
  }

  // Emit an event
  emit(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`Socket.IO: Cannot emit "${event}" - not connected`);
      return false;
    }
    
    try {
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
    return this.emit('join_chat', { chatId });
  }
  
  // Leave a chat room
  leaveChat(chatId) {
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
  
  // Get the last received message for an event
  getLastMessage(event) {
    return this.lastMessages[event] || null;
  }
}

// Create a singleton instance
const socketManager = new SocketManager();

export default socketManager;
