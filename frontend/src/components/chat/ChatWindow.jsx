import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import api from '../../services/api';

const ChatWindow = ({
  chat,
  currentUser,
  sendMessage,
  sendTypingIndicator,
  sendReadReceipt,
  typingUsers,
  onlineUsers,
  socketStatus 
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const messageEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Get the other participant in a direct chat
  const getParticipant = () => {
    if (chat.type === 'direct') {
      return chat.participants.find(p => p._id !== currentUser._id);
    }
    return null;
  };

  const participant = getParticipant();
  const isOnline = participant && onlineUsers[participant._id];

  // Load initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setMessages([]);
        isInitialLoad.current = true;
        
        const response = await api.getMessages(chat._id);
        
        setMessages(response.messages);
        setHasMore(response.hasMore);
        setNextCursor(response.nextCursor);
        setLoading(false);
        
        // Mark unread messages as read
        if (response.messages.length > 0) {
          const unreadMessages = response.messages.filter(
            msg => !msg.read && msg.sender._id !== currentUser._id
          );
          
          unreadMessages.forEach(message => {
            sendReadReceipt(message._id, chat._id);
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again.');
        setLoading(false);
      }
    };

    if (chat?._id) {
      fetchMessages();
    }
  }, [chat._id, currentUser._id, sendReadReceipt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoad.current = false;
    } else if (!isInitialLoad.current && messages.length > 0) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load more messages when scrolling to the top
  const loadMoreMessages = async () => {
    if (!hasMore || loading) return;
    
    try {
      setLoading(true);
      const response = await api.getMessages(chat._id, { before: nextCursor });
      
      setMessages(prevMessages => [...response.messages, ...prevMessages]);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
      setLoading(false);
    } catch (error) {
      console.error('Error loading more messages:', error);
      setError('Failed to load more messages. Please try again.');
      setLoading(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (content, messageType = 'text', attachment = null) => {
    try {
      const newMessage = await sendMessage(chat._id, content, messageType, attachment);
      
      // Update local messages list (if not already updated by Socket.IO)
      setMessages(prevMessages => {
        // Check if message already exists (might have been added by Socket.IO event)
        const messageExists = prevMessages.some(msg => msg._id === newMessage._id);
        if (messageExists) {
          return prevMessages;
        }
        return [...prevMessages, newMessage];
      });
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      return false;
    }
  };

  // Function to determine when to show date separator
  const shouldShowDateSeparator = (message, prevMessage) => {
    if (!prevMessage) return true;
    
    const messageDate = new Date(message.createdAt).toDateString();
    const prevMessageDate = new Date(prevMessage.createdAt).toDateString();
    
    return messageDate !== prevMessageDate;
  };

  // Format the date for the separator
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (now.getFullYear() === date.getFullYear()) {
      return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
    }
    
    return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get typing indicators text
  const getTypingIndicatorText = () => {
    if (!typingUsers || Object.keys(typingUsers).length === 0) return '';
    
    const typingUserIds = Object.keys(typingUsers);
    
    if (chat.type === 'direct') {
      return 'typing...';
    } else {
      // For group chats, show who's typing
      const typingParticipants = chat.participants.filter(p => 
        typingUserIds.includes(p._id) && p._id !== currentUser._id
      );
      
      if (typingParticipants.length === 1) {
        return `${typingParticipants[0].firstName} is typing...`;
      } else if (typingParticipants.length === 2) {
        return `${typingParticipants[0].firstName} and ${typingParticipants[1].firstName} are typing...`;
      } else if (typingParticipants.length > 2) {
        return 'Several people are typing...';
      }
    }
    
    return '';
  };

  // Calculate time since last activity for the "last seen"
  const getLastActiveTime = () => {
    if (!participant || isOnline) return null;
    
    if (!participant.lastActive) return 'a while ago';
    
    const lastActive = new Date(participant.lastActive);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    return lastActive.toLocaleDateString();
  };

  // Start a voice or video call
  const startCall = async (callType) => {
    try {
      const response = await api.startCall(chat._id, callType);
      
      // In a real app, this would trigger the call UI
      console.log(`Starting ${callType} call:`, response);
      
      // For this implementation, we'll just show an alert
      alert(`${callType.charAt(0).toUpperCase() + callType.slice(1)} call started!`);
    } catch (error) {
      console.error(`Error starting ${callType} call:`, error);
      setError(`Failed to start ${callType} call. Please try again.`);
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative">
            {participant?.profilePicture ? (
              <img
                src={participant.profilePicture}
                alt={`${participant.firstName} ${participant.lastName}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-base font-medium text-gray-600">
                  {participant?.firstName?.charAt(0)}
                  {participant?.lastName?.charAt(0)}
                </span>
              </div>
            )}
            
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          
          {/* Socket.IO connection status indicator */}
          {socketStatus !== 'CONNECTED' && (
            <div className="bg-yellow-50 text-yellow-800 text-sm px-3 py-1 rounded flex items-center ml-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {socketStatus === 'CONNECTING' ? 'Connecting...' : 
               socketStatus === 'DISCONNECTED' ? 'Reconnecting...' : 
               'Connection error'}
            </div>
          )}

          <div className="ml-3">
            <h3 className="text-base font-medium text-gray-900">
              {chat.type === 'direct'
                ? `${participant?.firstName} ${participant?.lastName}`
                : chat.name}
            </h3>
            <p className="text-xs text-gray-500">
              {isOnline 
                ? 'Online'
                : getLastActiveTime() ? `Last active ${getLastActiveTime()}` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => startCall('audio')}
            className="text-gray-500 hover:text-gray-700"
            title="Audio call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </button>
          
          <button 
            onClick={() => startCall('video')}
            className="text-gray-500 hover:text-gray-700"
            title="Video call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              <path d="M14 6a1 1 0 00-1 1v5a1 1 0 001 1h3a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
            </svg>
          </button>
          
          <button
            className="text-gray-500 hover:text-gray-700"
            title="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Messages List */}
      <div className="flex-grow overflow-y-auto bg-gray-50 px-4 py-2">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-500 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-gray-500">No messages yet.</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to say hello!</p>
            </div>
          </div>
        ) : (
          <div>
            {hasMore && (
              <div className="text-center py-2">
                <button
                  onClick={loadMoreMessages}
                  className="text-blue-500 hover:underline text-sm"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}
            
            <MessageList 
              messages={messages}
              currentUser={currentUser}
              formatDate={formatDate}
              shouldShowDateSeparator={shouldShowDateSeparator}
              participant={participant}
              onMessageRead={sendReadReceipt}
            />
            
            <div ref={messageEndRef} />
          </div>
        )}
      </div>
      
      {/* Typing Indicator */}
      {getTypingIndicatorText() && (
        <div className="px-4 py-1 text-xs text-gray-500">
          {getTypingIndicatorText()}
        </div>
      )}
      
      {/* Message Input */}
      <div className="border-t border-gray-200 p-3">
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={sendTypingIndicator}
          chatId={chat._id}
          disabled={socketStatus !== 'CONNECTED'}
        />
      </div>
    </div>
  );
};

export default ChatWindow;