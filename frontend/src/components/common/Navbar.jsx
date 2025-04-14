import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import img from "../../assets/MeetKats.jpg";
import img1 from "../../assets/messenger.png";
import notificationService from '../../services/notificationService';

const Sidebar = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications count on mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();
    
    // Poll for updates every minute
    const interval = setInterval(fetchNotificationCount, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (notifications) {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          const data = await notificationService.getNotifications(1, 5);
          setNotificationItems(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchNotifications();
    }
  }, [notifications]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    setNotifications(false);
    setMessages(false);
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
    setProfileMenuOpen(false);
    setMessages(false);
  };

  const toggleMessages = () => {
    setMessages(!messages);
    setProfileMenuOpen(false);
    setNotifications(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotificationItems(prev => 
        prev.map(item => 
          item.id === notificationId ? { ...item, read: true } : item
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Format timestamp
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setMessages(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search term:', e.target.search.value);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - Desktop */}
      <div className={`hidden md:flex flex-col bg-white border-r border-orange-200 ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out overflow-hidden fixed h-full z-10`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-orange-100">
          <Link to="/dashboard" className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg flex items-center justify-center shadow-md">
              <img src={img} alt="" className="h-8 w-8 rounded-md" />
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-400">Meetkats</span>
            )}
          </Link>
          <button 
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-orange-500 p-1"
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              {!isCollapsed ? (
                <input
                  type="search"
                  name="search"
                  id="search"
                  className="block w-full bg-orange-50 border border-orange-100 rounded-full py-2 pl-10 pr-3 text-sm placeholder-orange-300 focus:outline-none focus:bg-white focus:border-orange-300 focus:ring-orange-300 focus:text-gray-900 sm:text-sm"
                  placeholder="Search..."
                />
              ) : (
                <button
                  type="button"
                  className="w-full flex items-center justify-center bg-orange-50 rounded-full p-2 hover:bg-orange-100"
                  onClick={() => setIsCollapsed(false)}
                >
                  <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex-1 px-2 space-y-1">
            <Link to="/dashboard" className="group flex items-center px-2 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!isCollapsed && <span className="text-sm font-medium">Home</span>}
            </Link>

            <Link to="/network" className="group flex items-center px-2 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {!isCollapsed && <span className="text-sm font-medium">My Network</span>}
            </Link>

            <Link to="/portfolio" className="group flex items-center px-2 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {!isCollapsed && <span className="text-sm font-medium">Portfolio</span>}
            </Link>
            <Link to="/chat" className="group flex items-center px-2 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
            <div className='w-[22px] h-[22px]'
            ><img src={img1} alt="" /></div>
              {!isCollapsed && <span className="text-sm font-medium ml-3">Chats</span>}
            </Link>

            <div ref={messagesRef} className="relative">
              <button
                onClick={toggleMessages}
                className="w-full group flex items-center px-2 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {!isCollapsed && <span className="text-sm font-medium">Messages</span>}
              </button>

              {messages && !isCollapsed && (
                <div className="absolute left-full top-0 ml-2 w-96 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 overflow-hidden">
                  <div className="py-1">
                    <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-white">Messages</h3>
                        <Link to="/chat" className="text-xs font-medium text-white hover:text-orange-100">View all</Link>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-orange-50">
                        <p className="text-sm font-medium text-gray-900">No messages yet</p>
                        <p className="text-xs text-gray-500 mt-1">Connect with others to start messaging</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={notificationsRef} className="relative">
              <button
                onClick={toggleNotifications}
                className="w-full group flex items-center px-2 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!isCollapsed && <span className="text-sm font-medium">Notifications</span>}
              </button>

              {notifications && !isCollapsed && (
                <div className="absolute left-full top-0 ml-2 w-96 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 overflow-hidden">
                  <div>
                    <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-white">Notifications</h3>
                        <Link to="/notifications" className="text-xs font-medium text-white hover:text-orange-100">View all</Link>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="px-4 py-6 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                          <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                        </div>
                      ) : notificationItems.length > 0 ? (
                        notificationItems.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`px-4 py-3 hover:bg-orange-50 border-b border-orange-100 ${notification.read ? 'bg-white' : 'bg-orange-50'}`}
                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                          >
                            <div className="flex">
                              <div className="flex-shrink-0 mr-3">
                                {notification.sender?.profilePicture ? (
                                  <img 
                                    className="h-10 w-10 rounded-full"
                                    src={notification.sender.profilePicture}
                                    alt={`${notification.sender.firstName} ${notification.sender.lastName}`}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-orange-500">
                                      {notification.sender?.firstName?.charAt(0) || 'U'}
                                      {notification.sender?.lastName?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-900">{notification.content}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="mt-2 text-sm font-medium text-gray-900">No notifications yet</p>
                          <p className="text-xs text-gray-500">We'll notify you when something new happens</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Profile Section */}
        <div ref={profileRef} className="p-4 border-t border-orange-100">
          <button
            onClick={toggleProfileMenu}
            className="w-full flex items-center text-gray-600 hover:text-orange-500"
          >
            <div className="flex-shrink-0">
              {user?.profilePicture ? (
                <img 
                  className="h-10 w-10 rounded-lg border-2 border-orange-400" 
                  src={user.profilePicture} 
                  alt="" 
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1 text-left">
                <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.headline || 'Update your headline'}</p>
              </div>
            )}
          </button>

          {profileMenuOpen && !isCollapsed && (
            <div className="mt-3 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
              <div className="px-4 py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white">
                <div className="flex items-center">
                  {user?.profilePicture ? (
                    <img
                      className="h-12 w-12 rounded-lg border-2 border-white"
                      src={user.profilePicture}
                      alt=""
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center">
                      <span className="text-lg font-semibold text-orange-500">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-bold">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs truncate max-w-xs">{user?.headline || 'Update your headline'}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="mt-3 block text-center bg-white bg-opacity-20 text-white text-sm font-medium py-1 rounded-md hover:bg-opacity-30"
                >
                  View Profile
                </Link>
              </div>
              
              <div className="py-1">
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </div>
                </Link>
                <Link
                  to="/activity"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Your Activity
                  </div>
                </Link>
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-orange-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center">
            <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg flex items-center justify-center shadow-md">
              <img src={img} alt="" className="h-6 w-6 rounded-md" />
            </div>
            <span className="ml-2 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-400">Meetkats</span>
          </Link>

        

          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-orange-500"
            >
              {!mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={toggleMobileMenu}></div>
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-white shadow-lg transition duration-300 ease-in-out z-30 md:hidden`}>
        <div className="h-full flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-orange-100">
            <Link to="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg flex items-center justify-center shadow-md">
                <img src={img} alt="" className="h-6 w-6 rounded-md" />
              </div>
              <span className="ml-2 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-400">Meetkats</span>
            </Link>
            <button
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-orange-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="search"
                  name="search"
                  id="mobile-search"
                  className="block w-full bg-orange-50 border border-orange-100 rounded-full py-2 pl-10 pr-3 text-sm placeholder-orange-300 focus:outline-none focus:bg-white focus:border-orange-300 focus:ring-orange-300 focus:text-gray-900 sm:text-sm"
                  placeholder="Search..."
                />
              </div>
            </form>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-2">
            <nav className="space-y-1">
              <Link to="/dashboard" className="group flex items-center px-3 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">Home</span>
              </Link>

              <Link to="/network" className="group flex items-center px-3 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium">My Network</span>
              </Link>

              <Link to="/portfolio" className="group flex items-center px-3 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Portfolio</span>
              </Link>

              <Link to="/messages" className="group flex items-center px-3 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-sm font-medium">Messages</span>
              </Link>

              <Link to="/notifications" className="group flex items-center px-3 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-md">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                </div>
                <span className="text-sm font-medium">Notifications</span>
              </Link>
            </nav>
          </div>

          {/* Profile Section */}
          <div className="p-4 border-t border-orange-100 bg-orange-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user?.profilePicture ? (
                  <img 
                    className="h-10 w-10 rounded-lg border-2 border-orange-400" 
                    src={user.profilePicture} 
                    alt="" 
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.headline || 'Update your headline'}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Link
                to="/profile"
                className="block text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-100 px-3 py-2 rounded-md"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Your Profile
                </div>
              </Link>
              <Link
                to="/settings"
                className="block text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-100 px-3 py-2 rounded-md"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </div>
              </Link>
              <button
                onClick={onLogout}
                className="w-full text-left text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-100 px-3 py-2 rounded-md"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Needs to be adjusted for sidebar */}
      <div className={`md:ml-${isCollapsed ? '20' : '64'} transition-all duration-300 ease-in-out pt-16 md:pt-0 flex-1`}>
        {/* This is where your main content would go */}
        <div className="p-4">
          {/* Main content here */}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;