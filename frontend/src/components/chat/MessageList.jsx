import React, { useEffect, useRef } from 'react';
import Message from './Message';

const MessageList = ({
  messages,
  currentUser,
  formatDate,
  shouldShowDateSeparator,
  participant,
  onMessageRead
}) => {
  // Create refs to track which messages are visible
  const messageRefs = useRef({});
  
  // Setup intersection observer to mark messages as read when they become visible
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.dataset.messageId;
          const message = messages.find(msg => msg._id === messageId);
          
          if (message && !message.read && message.sender._id !== currentUser._id) {
            onMessageRead(messageId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);
    
    // Observe all unread messages from other users
    Object.values(messageRefs.current).forEach(node => {
      if (node) observer.observe(node);
    });

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [messages, currentUser._id, onMessageRead]);

  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
        
        const isCurrentUser = message.sender._id === currentUser._id;
        const isConsecutive = prevMessage && 
                            prevMessage.sender._id === message.sender._id &&
                            !shouldShowDateSeparator(message, prevMessage);
        
        // Calculate if we should show the time
        const showTime = !isConsecutive || 
                        (prevMessage && 
                        (new Date(message.createdAt) - new Date(prevMessage.createdAt)) > 5 * 60 * 1000);
        
        return (
          <React.Fragment key={message._id}>
            {showDateSeparator && (
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="mx-4 text-xs font-medium text-gray-500">
                  {formatDate(message.createdAt)}
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            )}
            
            <div 
              ref={el => {
                if (!isCurrentUser && !message.read) {
                  messageRefs.current[message._id] = el;
                }
              }}
              data-message-id={message._id}
            >
              <Message
                message={message}
                isCurrentUser={isCurrentUser}
                isConsecutive={isConsecutive}
                showTime={showTime}
                participant={!isCurrentUser ? message.sender : participant}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;