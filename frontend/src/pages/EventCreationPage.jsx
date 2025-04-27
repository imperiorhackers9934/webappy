import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Tag,
  AlertCircle
} from 'lucide-react';
import eventService from '../services/eventService';

const EventCreationPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    category: '',
    isOnline: false,
    location: '',
    locationDetails: {
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    virtualMeetingLink: '',
    coverImage: null,
    coverImagePreview: null,
    tags: '',
    maxAttendees: '',
    isPrivate: false,
    requireApproval: false
  });
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Form steps
  const formSteps = [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Date & Time' },
    { id: 3, name: 'Location' },
    { id: 4, name: 'Image & Settings' }
  ];
  
  // Handle standard input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle location detail input changes
  const handleLocationDetailChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      locationDetails: {
        ...prev.locationDetails,
        [name]: value
      }
    }));
  };
  
  // Handle cover image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should not exceed 5MB');
        return;
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        coverImage: file,
        coverImagePreview: previewUrl
      }));
      
      setError(null);
    }
  };
  
  // Categories based on your event model
  const categories = [
    { value: 'SOCIAL', label: 'Social' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'ENTERTAINMENT', label: 'Arts & Culture' },
    { value: 'FAMILY', label: 'Family' },
    { value: 'HEALTH_WELLNESS', label: 'Health & Wellness' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'CAREER', label: 'Career' },
    { value: 'OTHER', label: 'Other' }
  ];
  
  // Combine date and time input values
  const combineDateTime = (dateValue, timeValue) => {
    if (!dateValue) return null;
    
    const datePart = new Date(dateValue);
    
    if (!timeValue) {
      // If no time provided, set to start of day
      datePart.setHours(0, 0, 0, 0);
      return datePart;
    }
    
    // Parse time string (format: HH:MM)
    const [hours, minutes] = timeValue.split(':').map(Number);
    
    datePart.setHours(hours, minutes, 0, 0);
    return datePart;
  };
  
  // Form navigation
  const nextStep = () => {
    if (activeStep < formSteps.length) {
      setActiveStep(activeStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Validate current step
  const validateStep = () => {
    switch(activeStep) {
      case 1:
        if (!formData.title) {
          setError('Event title is required');
          return false;
        }
        if (!formData.category) {
          setError('Category is required');
          return false;
        }
        break;
        
      case 2:
        if (!formData.startDate) {
          setError('Start date is required');
          return false;
        }
        break;
        
      case 3:
        if (!formData.isOnline && !formData.location) {
          setError('Location is required for in-person events');
          return false;
        }
        break;
        
      default:
        break;
    }
    
    return true;
  };
  
  // Handle step navigation with validation
  const handleStepChange = (direction) => {
    setError(null);
    
    if (direction === 'next') {
      if (validateStep()) {
        nextStep();
      }
    } else {
      prevStep();
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate all required fields
      if (!formData.title) {
        setError('Event title is required');
        setActiveStep(1);
        setSubmitting(false);
        return;
      }
      
      if (!formData.startDate) {
        setError('Start date is required');
        setActiveStep(2);
        setSubmitting(false);
        return;
      }
      
      if (!formData.category) {
        setError('Category is required');
        setActiveStep(1);
        setSubmitting(false);
        return;
      }
      
      if (!formData.isOnline && !formData.location) {
        setError('Location is required for in-person events');
        setActiveStep(3);
        setSubmitting(false);
        return;
      }
      
      // Prepare data for API
      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: combineDateTime(formData.startDate, formData.startTime),
        endDate: formData.endDate ? combineDateTime(formData.endDate, formData.endTime) : null,
        category: formData.category,
        isOnline: formData.isOnline,
        location: formData.isOnline ? null : formData.location,
        locationDetails: formData.isOnline ? null : formData.locationDetails,
        virtualMeetingLink: formData.isOnline ? formData.virtualMeetingLink : null,
        coverImage: formData.coverImage,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        isPrivate: formData.isPrivate,
        requireApproval: formData.requireApproval
      };
      
      // Call API to create event
      const response = await eventService.createEvent(eventData);
      
      // Set success state
      setSuccess(true);
      
      // Navigate to the new event page
      setTimeout(() => {
        navigate(`/events/${response.data._id || response.data.id}/tickets/create`);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event. Please try again later.');
      setSubmitting(false);
    }
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Render the sidebar
  const renderSidebar = () => {
    return (
      <div className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className="flex items-center p-4 border-b border-gray-200">
          <div className="h-8 w-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold">
            M
          </div>
          {!sidebarCollapsed && (
            <span className="ml-2 text-lg font-semibold text-orange-500">Meetkats</span>
          )}
          <button 
            onClick={toggleSidebar} 
            className="ml-auto text-gray-500 hover:text-orange-500"
          >
            {sidebarCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className={`w-full px-3 py-2 pl-9 bg-gray-100 rounded-full text-sm focus:outline-none ${sidebarCollapsed ? 'hidden' : ''}`}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 absolute left-3 top-2 ${sidebarCollapsed ? 'position-static mx-auto' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <nav className="mt-4">
          <div className={`flex items-center px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-500 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!sidebarCollapsed && <span className="ml-3">Home</span>}
          </div>
          
          <div className={`flex items-center px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-500 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {!sidebarCollapsed && <span className="ml-3">My Network</span>}
          </div>
          
          <div className={`flex items-center px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-500 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {!sidebarCollapsed && <span className="ml-3">Portfolio</span>}
          </div>
          
          <div className={`flex items-center px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-500 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {!sidebarCollapsed && <span className="ml-3">Chats</span>}
          </div>
          
          <div className={`flex items-center px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-500 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {!sidebarCollapsed && <span className="ml-3">Messages</span>}
          </div>
          
          <div className={`flex items-center px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-500 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {!sidebarCollapsed && <span className="ml-3">Notifications</span>}
          </div>
        </nav>
      </div>
    );
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Tech Conference 2025"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Describe your event, what attendees can expect, etc."
              ></textarea>
              <p className="mt-1 text-sm text-orange-500">
                Tip: A good description helps attendees understand what to expect.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="relative">
                <Tag className="w-5 h-5 text-orange-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., conference, technology, networking (comma separated)"
                />
              </div>
              <p className="mt-1 text-sm text-orange-500">
                Enter tags separated by commas to help people discover your event.
              </p>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">When is your event?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Where is your event?</h3>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isOnline"
                  name="isOnline"
                  checked={formData.isOnline}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="isOnline" className="ml-2 block text-sm text-gray-700">
                  This is an online event
                </label>
              </div>
            </div>
            
            {formData.isOnline ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Virtual Meeting Link
                </label>
                <input
                  type="url"
                  name="virtualMeetingLink"
                  value={formData.virtualMeetingLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., https://zoom.us/j/123456789"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Meeting link will only be shared with registered attendees.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., Tech Center"
                    required={!formData.isOnline}
                  />
                </div>
                
                <button
                  type="button"
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium mb-4"
                  onClick={() => setShowLocationDetails(!showLocationDetails)}
                >
                  {showLocationDetails ? 'Hide' : 'Add'} location details
                </button>
                
                {showLocationDetails && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.locationDetails.address}
                        onChange={handleLocationDetailChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., 123 Main St"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.locationDetails.city}
                          onChange={handleLocationDetailChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.locationDetails.state}
                          onChange={handleLocationDetailChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.locationDetails.postalCode}
                          onChange={handleLocationDetailChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.locationDetails.country}
                          onChange={handleLocationDetailChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Cover Image</h3>
              
              {!formData.coverImagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="mt-2 cursor-pointer rounded-md px-3 py-1 bg-orange-500 text-white text-sm font-medium hover:bg-orange-600">
                    Choose Image
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={formData.coverImagePreview} 
                    alt="Event cover preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(formData.coverImagePreview);
                      setFormData({
                        ...formData,
                        coverImage: null,
                        coverImagePreview: null
                      });
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Settings</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Capacity
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Unlimited"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave blank for unlimited capacity.
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Privacy Settings</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        name="isPrivate"
                        checked={formData.isPrivate}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="isPrivate" className="font-medium text-gray-700">
                        Private event
                      </label>
                      <p className="text-gray-500">Only visible to invited guests</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="requireApproval"
                        name="requireApproval"
                        checked={formData.requireApproval}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="requireApproval" className="font-medium text-gray-700">
                        Require approval for attendees
                      </label>
                      <p className="text-gray-500">Manually approve each registration</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Main render
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      {renderSidebar()}
      
      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/events" className="text-orange-500 hover:text-orange-600 flex items-center">
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Back to Events</span>
            </Link>
            
            <h1 className="text-xl font-semibold text-gray-900">Create New Event</h1>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
          
          {/* Step Indicators */}
          <div className="max-w-4xl mx-auto px-4 pb-2">
            <div className="flex">
              {formSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      activeStep === step.id 
                        ? 'bg-orange-500 text-white' 
                        : activeStep > step.id 
                          ? 'bg-orange-100 text-orange-500 border border-orange-500' 
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {activeStep > step.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  
                  <span className={`ml-2 text-sm font-medium ${
                    activeStep === step.id 
                      ? 'text-gray-900' 
                      : activeStep > step.id 
                        ? 'text-orange-500' 
                        : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                  
                  {index < formSteps.length - 1 && (
                    <div className={`h-0.5 w-12 mx-2 ${activeStep > step.id ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={(e) => {e.preventDefault(); handleSubmit();}}>
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={activeStep === 1}
                className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                  activeStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Previous
              </button>
              
              {activeStep < formSteps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                    submitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventCreationPage;
