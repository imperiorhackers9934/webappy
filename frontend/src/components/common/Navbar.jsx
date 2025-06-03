"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import img from "../../assets/MeetKats.jpg"
import img1 from "../../assets/messenger.png"
import notificationService from "../../services/notificationService"

const Sidebar = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [notificationItems, setNotificationItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [messages, setMessages] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const profileRef = useRef(null)
  const notificationsRef = useRef(null)
  const messagesRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const navigate = useNavigate()

  // Fetch notifications count on mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const count = await notificationService.getUnreadCount()
        setUnreadCount(count)
      } catch (error) {
        console.error("Error fetching notification count:", error)
      }
    }

    fetchNotificationCount()

    // Poll for updates every minute
    const interval = setInterval(fetchNotificationCount, 60000)

    return () => clearInterval(interval)
  }, [])

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (notifications) {
      const fetchNotifications = async () => {
        setLoading(true)
        try {
          const data = await notificationService.getNotifications(1, 5)
          setNotificationItems(Array.isArray(data) ? data : [])
        } catch (error) {
          console.error("Error fetching notifications:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchNotifications()
    }
  }, [notifications])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen)
    setNotifications(false)
    setMessages(false)
  }

  const toggleNotifications = () => {
    setNotifications(!notifications)
    setProfileMenuOpen(false)
    setMessages(false)
  }

  const toggleMessages = () => {
    setMessages(!messages)
    setProfileMenuOpen(false)
    setNotifications(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)

      // Update local state
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotificationItems((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Format timestamp
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown time"

    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffMs = now - notificationTime

    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    }
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotifications(false)
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setMessages(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Search term:", e.target.search.value)
  }

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "My Network",
      href: "/network",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      name: "Portfolio",
      href: "/portfolio",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: "Chats",
      href: "/chat",
      icon: <img src={img1 || "/placeholder.svg"} alt="" className="h-5 w-5" />,
    },
  ]

  return (
    <>
      {/* Main Horizontal Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div className="h-9 w-9 bg-gradient-to-r from-green-500 to-green-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <img src={img || "/placeholder.svg"} alt="" className="h-7 w-7 rounded-lg" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-400 hidden sm:block">
                  Meetkats
                </span>
              </Link>
            </div>

            {/* Center Section - Navigation & Search */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200 group"
                  >
                    <span className="md:hidden w-7 group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={`h-4 w-4 transition-colors duration-200 ${searchFocused ? "text-green-500" : "text-green-400"}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="search"
                      name="search"
                      id="search"
                      className="w-80 bg-green-50 border border-green-100 rounded-full py-2.5 pl-10 pr-4 text-sm placeholder-green-300 focus:outline-none focus:bg-white focus:border-green-300 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                      placeholder="Search people, posts, companies..."
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Right Section - Actions & Profile */}
            <div className="flex items-center space-x-2">
              {/* Messages Dropdown */}
              <div ref={messagesRef} className="relative hidden lg:block">
                <button
                  onClick={toggleMessages}
                  className="p-2.5 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200 relative"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </button>

                {messages && (
                  <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                    <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-400">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-white">Messages</h3>
                        <Link
                          to="/chat"
                          className="text-xs font-medium text-white hover:text-green-100 transition-colors"
                        >
                          View all
                        </Link>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="px-6 py-8 text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto text-gray-300 mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-900 mb-1">No messages yet</p>
                        <p className="text-xs text-gray-500">Connect with others to start messaging</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications Dropdown */}
              <div ref={notificationsRef} className="relative hidden lg:block">
                <button
                  onClick={toggleNotifications}
                  className="p-2.5 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200 relative"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                    <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-400">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        <Link
                          to="/notifications"
                          className="text-xs font-medium text-white hover:text-green-100 transition-colors"
                        >
                          View all
                        </Link>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loading ? (
                        <div className="px-6 py-8 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mb-3"></div>
                          <p className="text-sm text-gray-500">Loading notifications...</p>
                        </div>
                      ) : notificationItems.length > 0 ? (
                        notificationItems.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-6 py-4 hover:bg-green-50 border-b border-green-50 cursor-pointer transition-colors ${notification.read ? "bg-white" : "bg-green-25"}`}
                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {notification.sender?.profilePicture ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={notification.sender.profilePicture || "/placeholder.svg"}
                                    alt={`${notification.sender.firstName} ${notification.sender.lastName}`}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-green-500">
                                      {notification.sender?.firstName?.charAt(0) || "U"}
                                      {notification.sender?.lastName?.charAt(0) || "U"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{notification.content}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-8 text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto text-gray-300 mb-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          <p className="text-sm font-medium text-gray-900 mb-1">No notifications yet</p>
                          <p className="text-xs text-gray-500">We'll notify you when something new happens</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-green-50 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0">
                    {user?.profilePicture ? (
                      <img
                        className="h-9 w-9 rounded-xl border-2 border-green-200 group-hover:border-green-300 transition-colors"
                        src={user.profilePicture || "/placeholder.svg"}
                        alt=""
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center border-2 border-green-200 group-hover:border-green-300 transition-colors">
                        <span className="text-sm font-semibold text-white">
                          {user?.firstName?.charAt(0)}
                          {user?.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors hidden lg:block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                    <div className="px-6 py-5 bg-gradient-to-r from-green-500 to-green-400 text-white">
                      <div className="flex items-center space-x-4">
                        {user?.profilePicture ? (
                          <img
                            className="h-14 w-14 rounded-xl border-3 border-white shadow-lg"
                            src={user.profilePicture || "/placeholder.svg"}
                            alt=""
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center border-3 border-white shadow-lg">
                            <span className="text-lg font-bold text-white">
                              {user?.firstName?.charAt(0)}
                              {user?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold truncate">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-green-100 truncate">{user?.headline || "Update your headline"}</p>
                        </div>
                      </div>
                      <Link
                        to={`/profile/${user.id}`}
                        className="mt-4 block text-center bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-white/30 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/settings"
                        className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      <Link
                        to="/activity"
                        className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Your Activity
                      </Link>
                      <div className="border-t border-gray-100 my-2"></div>
                      <button
                        onClick={onLogout}
                        className="flex items-center w-full px-6 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
              >
                {!mobileMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden border-t border-green-100 px-4 py-3">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="search"
                name="search"
                id="mobile-search"
                className="w-full bg-green-50 border border-green-100 rounded-full py-2.5 pl-10 pr-4 text-sm placeholder-green-300 focus:outline-none focus:bg-white focus:border-green-300 focus:ring-2 focus:ring-green-200"
                placeholder="Search..."
              />
            </div>
          </form>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleMobileMenu}></div>}

      {/* Mobile Slide-out Menu */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-green-100 bg-gradient-to-r from-green-500 to-green-400">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                <img src={img || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-lg" />
              </div>
              <span className="text-xl font-bold text-white">Meetkats</span>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex-1 overflow-y-auto p-6">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
                  onClick={toggleMobileMenu}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}

              <Link
                to="/chat"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
                onClick={toggleMobileMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="text-sm font-medium">Messages</span>
              </Link>

              <Link
                to="/notifications"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
                onClick={toggleMobileMenu}
              >
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">Notifications</span>
              </Link>
            </nav>
          </div>

          {/* Mobile Profile Section */}
          <div className="p-6 border-t border-green-100 bg-green-50">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0">
                {user?.profilePicture ? (
                  <img
                    className="h-12 w-12 rounded-xl border-2 border-green-200"
                    src={user.profilePicture || "/placeholder.svg"}
                    alt=""
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.headline || "Update your headline"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/profile"
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-100 transition-all duration-200 text-sm"
                onClick={toggleMobileMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Your Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-100 transition-all duration-200 text-sm"
                onClick={toggleMobileMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </Link>
              <button
                onClick={() => {
                  onLogout()
                  toggleMobileMenu()
                }}
                className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-gray-600 hover:text-green-500 hover:bg-green-100 transition-all duration-200 text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16 lg:h-16"></div>
    </>
  )
}

export default Sidebar
