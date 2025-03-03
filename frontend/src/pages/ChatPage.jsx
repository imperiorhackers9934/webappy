// ChatPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import api from '../services/api';
import useSocketIO from '../hooks/usesocketio';

const ChatPage = () => {
  const { user, token } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [isDebugMode] = useState(import.meta.env.DEV || window.location.search.includes('debug'));
    // More robust socket URL generation
    const socketUrl = (() => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      const port = import.meta.env.VITE_SOCKET_PORT || '3000';
      return `${protocol}//${hostname}:${port}`;
    })();
    
    const { 
      status: socketStatus, 
      error: socketError, 
      diagnoseError, // Added error diagnosis
      on, 
      emit,
      joinRoom,
      leaveRoom
    } = useSocketIO(socketUrl, token, {
      maxReconnectAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      socketPath: '/socket.io/' // Explicit socket path
    });
  // Update error state when Socket.IO has an error
  useEffect(() => {
    if (socketError) {
      // [MODIFIED] Use advanced error diagnosis
      const detailedError = diagnoseError(socketError);
      setError(detailedError);
      
      // Optional: Log to error tracking service
      logErrorToService(detailedError);
    }
  }, [socketError]);
  // Join the active chat room
  useEffect(() => {
    if (activeChat && socketStatus === 'CONNECTED') {
      // Join the current chat room
      joinRoom(activeChat._id);
      
      // Return cleanup function to leave the room when chat changes
      return () => {
        leaveRoom(activeChat._id);
      };
    }
  }, [activeChat, socketStatus, joinRoom, leaveRoom]);
  
  // Register Socket.IO event handlers
  useEffect(() => {
    // New message handler
    const newMessageUnregister = on('new_message', (message) => {
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(chat => chat._id === message.chatRoom);
        
        if (chatIndex !== -1) {
          // Update last message of the chat
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: message
          };
          
          // Move this chat to the top of the list
          const chatToMove = updatedChats[chatIndex];
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chatToMove);
          
          // If this is the active chat, mark as read
          if (activeChat && activeChat._id === message.chatRoom) {
            sendReadReceipt(message._id, message.chatRoom);
          }
        }
        
        return updatedChats;
      });
      
      // If this message belongs to the active chat, update it
      if (activeChat && activeChat._id === message.chatRoom) {
        setActiveChat(prevChat => ({
          ...prevChat,
          lastMessage: message
        }));
      }
    });
    
    // Typing indicator handler
    const typingUnregister = on('typing', (data) => {
      const { chatId, userId, isTyping } = data;
      
      setTypingUsers(prev => {
        if (isTyping) {
          return { ...prev, [chatId]: { ...prev[chatId], [userId]: true } };
        } else {
          const updatedTyping = { ...prev };
          if (updatedTyping[chatId]) {
            delete updatedTyping[chatId][userId];
            if (Object.keys(updatedTyping[chatId]).length === 0) {
              delete updatedTyping[chatId];
            }
          }
          return updatedTyping;
        }
      });
    });
    
    // Presence update handler
    const presenceUnregister = on('presence_update', (data) => {
      const { userId, status } = data;
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: status === 'online'
      }));
    });
    
    // Message read handler
    const messageReadUnregister = on('message_read', (data) => {
      const { messageId, chatId } = data;
      
      if (activeChat && activeChat._id === chatId) {
        console.log(`Message ${messageId} marked as read`);
      }
    });
    
    // Initial data handler
    const initUnregister = on('init', (data) => {
      console.log('Received initial data:', data);
      
      // Handle initial online users
      if (data.onlineUsers) {
        setOnlineUsers(data.onlineUsers);
      }
    });
    
    // Cleanup all handlers
    return () => {
      newMessageUnregister();
      typingUnregister();
      presenceUnregister();
      messageReadUnregister();
      initUnregister();
    };
  }, [on, activeChat]);
  
  // Send read receipt for a message
  const sendReadReceipt = useCallback((messageId, chatRoomId) => {
    emit('read_message', {
      messageId,
      chatId: chatRoomId || (activeChat ? activeChat._id : null)
    });
  }, [emit, activeChat]);
  
  // Send typing indicator
  const sendTypingIndicator = useCallback((chatId, isTyping) => {
    emit('typing', {
      chatId,
      isTyping
    });
  }, [emit]);
  
  // Load chat list
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await api.getChats();
        setChats(response);
        
        // If chatId is provided in URL, set it as active
        if (chatId) {
          const selectedChat = response.find(chat => chat._id === chatId);
          if (selectedChat) {
            setActiveChat(selectedChat);
          } else if (response.length > 0) {
            // If chat not found, navigate to first chat
            navigate(`/chat/${response[0]._id}`, { replace: true });
          }
        } else if (response.length > 0) {
          // If no chatId in URL but we have chats, set active chat without navigation
          setActiveChat(response[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats. Please try again later.');
        setLoading(false);
      }
    };
  
    if (user) {
      fetchChats();
    }
  }, [user, chatId, navigate]);
  
  // Create a new chat
  const createNewChat = async (participantId) => {
    try {
      setLoading(true);
      const response = await api.createChat(participantId);
      // Add the new chat to the list and navigate to it
      setChats(prev => [response, ...prev]);
      navigate(`/chat/${response._id}`);
      setLoading(false);
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create new chat. Please try again.');
      setLoading(false);
    }
  };
  
  // Send a message
  const sendMessage = async (chatId, content, messageType = 'text', attachments = null) => {
    try {
      let response;
      
      // Validate inputs
      if (!chatId) {
        console.error('No chat ID provided');
        throw new Error('Chat ID is required');
      }
      
      // Send message via API first
      const messageData = {
        content,
        messageType
      };
      
      try {
        // Handle attachments if present
        if (attachments) {
          // This would use a FormData approach for file uploads
          const formData = new FormData();
          formData.append('content', content);
          formData.append('messageType', messageType);
          
          if (messageType === 'image' || messageType === 'video' || messageType === 'file') {
            formData.append('media', attachments);
          }
          
          response = await api.sendMessageWithAttachment(chatId, formData);
        } else {
          response = await api.sendMessage(chatId, messageData);
        }
      } catch (apiError) {
        console.error('API Send Message Error:', apiError);
        
        // Log detailed error information
        if (apiError.response) {
          console.error('Server Response:', apiError.response.data);
          console.error('Server Status:', apiError.response.status);
          console.error('Server Headers:', apiError.response.headers);
        }
        
        throw apiError;
      }
      
      // Extra validation of response
      if (!response) {
        console.error('No response received from message send');
        throw new Error('No response from server');
      }
      
      // Ensure response has an _id (defensive programming)
      if (!response._id) {
        console.warn('Message response missing _id', response);
        
        // Generate a temporary ID
        response._id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Emit the message via Socket.IO for real-time updates
      emit('new_message', {
        _id: response._id,
        content,
        chatId,
        messageType
      });
      
      // Update the chat with the new message
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(chat => chat._id === chatId);
        
        if (chatIndex !== -1) {
          // Update last message
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: response
          };
          
          // Move to top
          const chatToMove = updatedChats[chatIndex];
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chatToMove);
        }
        
        return updatedChats;
      });
      
      return response;
    } catch (error) {
      console.error('Comprehensive Send Message Error:', error);
      
      // More user-friendly error handling
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Failed to send message. Please try again.';
      
      // Optional: Show error to user
      setError(errorMessage);
      
      throw error;
    }
  };
  // Render UI
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Please log in to access chat</h1>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex overflow-hidden">
        <ChatSidebar 
          chats={chats} 
          activeChat={activeChat} 
          createNewChat={createNewChat}
          onChatSelect={(chat) => navigate(`/chat/${chat._id}`)}
          onlineUsers={onlineUsers}
          currentUser={user}
          loading={loading}
        />
        
        {activeChat ? (
          <ChatWindow 
            chat={activeChat}
            currentUser={user}
            sendMessage={sendMessage}
            sendTypingIndicator={(isTyping) => sendTypingIndicator(activeChat._id, isTyping)}
            sendReadReceipt={sendReadReceipt}
            typingUsers={typingUsers[activeChat._id] || {}}
            onlineUsers={onlineUsers}
            socketStatus={socketStatus}
          />
        ) : (
          <div className="flex-grow flex items-center justify-center bg-white">
            <div className="text-center p-6">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Your Messages</h2>
              <p className="mt-2 text-gray-600">Send private messages to your connections</p>
              <button 
                onClick={() => navigate('/network')}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              >
                Find Connections
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 right-0 p-2"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Socket status indicator */}
      {socketStatus !== 'CONNECTED' && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-md">
          <p>
            {socketStatus === 'CONNECTING' ? 'Connecting to chat service...' : 
             socketStatus === 'DISCONNECTED' ? 'Disconnected from chat service. Reconnecting...' : 
             'Connection error. Attempting to reconnect...'}
          </p>
        </div>
      )}
      
      {/* Debugger (development only) */}
      {isDebugMode && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-4 rounded shadow-md max-w-md">
          <h3 className="font-bold mb-2">Socket.IO Debug</h3>
          <p>Status: <span className={
            socketStatus === 'CONNECTED' ? 'text-green-400' : 
            socketStatus === 'CONNECTING' ? 'text-yellow-400' : 
            'text-red-400'
          }>{socketStatus}</span></p>
          <p className="text-xs mt-2 text-gray-400">URL: {socketUrl}</p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;