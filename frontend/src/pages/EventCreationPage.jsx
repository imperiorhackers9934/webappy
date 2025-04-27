import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Image, 
  Tag, 
  Info, 
  Save,
  ArrowLeft,
  Upload,
  X,
  Globe,
  Link as LinkIcon,
  Users,
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import eventService from '../services/eventService';
import Sidebar from '../components/common/Navbar';  // Import the Sidebar component

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
  
  // Clear cover image
  const handleClearImage = () => {
    if (formData.coverImagePreview) {
      URL.revokeObjectURL(formData.coverImagePreview);
    }
    
    setFormData(prev => ({
      ...prev,
      coverImage: null,
      coverImagePreview: null
    }));
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate required fields
      if (!formData.title) {
        setError('Event title is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.startDate) {
        setError('Start date is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.category) {
        setError('Category is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.isOnline && !formData.location) {
        setError('Location is required for in-person events');
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
      
      console.log('Creating event with data:', eventData);
      
      // Call API to create event
      const response = await eventService.createEvent(eventData);
      console.log('Event created successfully:', response);
      
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
  
  // Cancel form submission
  const handleCancel = () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel? Your event data will be lost.');
    if (confirmCancel) {
      navigate('/events');
    }
  };
  
  if (success) {
    return (
      <div className="flex h-screen bg-orange-50">
        {/* Include Sidebar */}
        <Sidebar user={user} onLogout={onLogout} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pt-4 md:pt-0 md:ml-64">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-orange-900 mb-2">Event Created Successfully!</h1>
              <p className="text-lg text-orange-800 mb-8">
                Your event has been created and is now visible to attendees.
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
                  onClick={() => navigate(`/events/${response?.data?._id || response?.data?.id || 'new'}`)}
                >
                  View Event
                </button>
                <button 
                  className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md shadow-sm text-orange-700 bg-white hover:bg-orange-50"
                  onClick={() => navigate('/events/new')}
                >
                  Create Another Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-orange-50">
      {/* Include Sidebar */}
      <Sidebar user={user} onLogout={onLogout} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-16 md:pt-0 md:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => navigate('/events')} 
                  className="flex items-center text-orange-600 hover:text-orange-800 transition"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span>Back to Events</span>
                </button>
              </div>
              <h1 className="text-xl font-semibold text-orange-900">Create New Event</h1>
              <div>
                <button 
                  type="button" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 transition"
                  form="create-event-form"
                  onClick={handleSubmit}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
                <button 
                  className="ml-auto pl-3" 
                  onClick={() => setError(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          
          <form id="create-event-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Basic Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Basic Info Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
                  <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-orange-500" />
                    Basic Information
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Event Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-orange-800 mb-1">
                        Event Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Tech Conference 2025"
                        className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                        required
                      />
                    </div>
                    
                    {/* Event Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-orange-800 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder="Describe your event, what attendees can expect, etc."
                        className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                      />
                      <p className="mt-1 text-sm text-orange-500 italic">
                        Tip: A good description helps attendees understand what to expect.
                      </p>
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-orange-800 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Tags */}
                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-orange-800 mb-1">
                        Tags
                      </label>
                      <div className="flex items-center">
                        <Tag className="w-5 h-5 text-orange-500 mr-2" />
                        <input
                          type="text"
                          id="tags"
                          name="tags"
                          value={formData.tags}
                          onChange={handleInputChange}
                          placeholder="e.g., conference, technology, networking (comma separated)"
                          className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                        />
                      </div>
                      <p className="mt-1 text-sm text-orange-500 italic">
                        Enter tags separated by commas to help people discover your event.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Date and Time Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
                  <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                    Date and Time
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Start Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-orange-800 mb-1">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-orange-500 mr-2" />
                          <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-orange-800 mb-1">
                          Start Time
                        </label>
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-orange-500 mr-2" />
                          <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* End Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-orange-800 mb-1">
                          End Date
                        </label>
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-orange-500 mr-2" />
                          <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            min={formData.startDate} // Can't be earlier than start date
                            className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-orange-800 mb-1">
                          End Time
                        </label>
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-orange-500 mr-2" />
                          <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Location Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
                  <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                    Location
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Event Type (Online/In-Person) */}
                    <div>
                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          id="isOnline"
                          name="isOnline"
                          checked={formData.isOnline}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-300 rounded transition"
                        />
                        <label htmlFor="isOnline" className="ml-2 block text-sm font-medium text-orange-800">
                          This is an online event
                        </label>
                      </div>
                      
                      {/* Virtual Meeting Link */}
                      {formData.isOnline && (
                        <div className="p-4 bg-orange-50 rounded-md border border-orange-200 shadow-sm">
                          <label htmlFor="virtualMeetingLink" className="block text-sm font-medium text-orange-800 mb-1">
                            Virtual Meeting Link
                          </label>
                          <div className="flex items-center">
                            <Globe className="w-5 h-5 text-orange-500 mr-2" />
                            <input
                              type="url"
                              id="virtualMeetingLink"
                              name="virtualMeetingLink"
                              value={formData.virtualMeetingLink}
                              onChange={handleInputChange}
                              placeholder="e.g., https://zoom.us/j/123456789"
                              className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                            />
                          </div>
                          <p className="mt-1 text-sm text-orange-600">
                            Meeting link will only be shared with registered attendees.
                          </p>
                        </div>
                      )}
                      
                      {/* Physical Location */}
                      {!formData.isOnline && (
                        <div className="p-4 bg-orange-50 rounded-md border border-orange-200 shadow-sm">
                          <label htmlFor="location" className="block text-sm font-medium text-orange-800 mb-1">
                            Venue <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center">
                            <MapPin className="w-5 h-5 text-orange-500 mr-2" />
                            <input
                              type="text"
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              placeholder="e.g., Tech Center"
                              className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                              required={!formData.isOnline}
                            />
                          </div>
                          
                          <div className="mt-4">
                            <button
                              type="button"
                              className="text-sm text-orange-600 font-medium flex items-center hover:text-orange-800 transition"
                              onClick={() => setShowLocationDetails(!showLocationDetails)}
                            >
                              {showLocationDetails ? 'Hide' : 'Add'} location details
                              {showLocationDetails ? (
                                <X className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronRight className="ml-1 h-4 w-4" />
                              )}
                            </button>
                          </div>
                          
                          {showLocationDetails && (
                            <div className="mt-4 space-y-4 p-4 bg-white rounded-md border border-orange-200 shadow-sm">
                              <div>
                                <label htmlFor="address" className="block text-sm font-medium text-orange-800 mb-1">
                                  Street Address
                                </label>
                                <input
                                  type="text"
                                  id="address"
                                  name="address"
                                  value={formData.locationDetails.address}
                                  onChange={handleLocationDetailChange}
                                  placeholder="e.g., 123 Main St"
                                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor="city" className="block text-sm font-medium text-orange-800 mb-1">
                                    City
                                  </label>
                                  <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.locationDetails.city}
                                    onChange={handleLocationDetailChange}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="state" className="block text-sm font-medium text-orange-800 mb-1">
                                    State/Province
                                  </label>
                                  <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.locationDetails.state}
                                    onChange={handleLocationDetailChange}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor="postalCode" className="block text-sm font-medium text-orange-800 mb-1">
                                    Postal Code
                                  </label>
                                  <input
                                    type="text"
                                    id="postalCode"
                                    name="postalCode"
                                    value={formData.locationDetails.postalCode}
                                    onChange={handleLocationDetailChange}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="country" className="block text-sm font-medium text-orange-800 mb-1">
                                    Country
                                  </label>
                                  <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    value={formData.locationDetails.country}
                                    onChange={handleLocationDetailChange}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Image Upload & Settings */}
              <div className="lg:col-span-1 space-y-6">
                {/* Cover Image Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
                  <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                    <Image className="w-5 h-5 mr-2 text-orange-500" />
                    Cover Image
                  </h2>
                  
                  {!formData.coverImagePreview ? (
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50 hover:bg-orange-100 transition">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-orange-500" />
                        <div className="mt-2">
                          <label 
                            htmlFor="cover-image" 
                            className="cursor-pointer text-orange-600 font-medium hover:text-orange-800 transition"
                          >
                            <span>Upload an image</span>
                            <input 
                              id="cover-image" 
                              name="coverImage" 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="sr-only" 
                            />
                          </label>
                          <p className="text-xs text-orange-600">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={formData.coverImagePreview} 
                        alt="Event cover preview" 
                        className="w-full h-48 object-cover rounded-lg border border-orange-300 shadow-sm"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-white text-orange-700 rounded-full p-1.5 shadow-md hover:bg-orange-100 transition"
                        onClick={handleClearImage}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  <p className="mt-2 text-sm text-orange-600 italic">
                    A compelling cover image helps attract attendees to your event.
                  </p>
                </div>
                
                {/* Event Settings Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
                  <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-orange-500" />
                    Event Settings
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Capacity */}
                    <div>
                      <label htmlFor="maxAttendees" className="block text-sm font-medium text-orange-800 mb-1">
                        Maximum Capacity
                      </label>
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-orange-500 mr-2" />
                        <input
                          type="number"
                          id="maxAttendees"
                          name="maxAttendees"
                          value={formData.maxAttendees}
                          onChange={handleInputChange}
                          min="1"
                          placeholder="Unlimited"
                          className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition"
                        />
                      </div>
                      <p className="mt-1 text-sm text-orange-600 italic">
                        Leave blank for unlimited capacity.
                      </p>
                    </div>
                  
                    {/* Privacy Settings */}
                    <div className="border-t border-orange-200 pt-4 mt-4">
                      <h3 className="text-md font-medium text-orange-800 mb-3 flex items-center">
                        <Eye className="w-4 h-4 mr-2 text-orange-500" />
                        Privacy Settings
                      </h3>
                      
                      <div className="space-y-3 p-3 bg-orange-50 rounded-md">
                        {/* Private Event */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isPrivate"
                            name="isPrivate"
                            checked={formData.isPrivate}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-300 rounded transition"
                          />
                          <label htmlFor="isPrivate" className="ml-2 block text-sm text-orange-800">
                            Private event (only visible to invited guests)
                          </label>
                        </div>
                        
                        {/* Require Approval */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="requireApproval"
                            name="requireApproval"
                            checked={formData.requireApproval}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-300 rounded transition"
                          />
                          <label htmlFor="requireApproval" className="ml-2 block text-sm text-orange-800">
                            Require approval for attendees
                          </label>
                        </div>
                        
                        <div className="flex items-center text-sm text-orange-600 mt-2 p-2 bg-white rounded border border-orange-200">
                          <Info className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>
                            Private events won't appear in search results or event listings.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Help Section */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg p-4 shadow-sm text-white">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Need Help?
                  </h3>
                  <p className="text-sm mb-3 text-white">
                    Our event creation guide provides tips for creating successful events.
                  </p>
                  <a 
                    href="/help/event-creation" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-sm font-medium text-white hover:text-orange-100 flex items-center transition bg-white bg-opacity-20 p-2 rounded"
                  >
                    View Event Creation Guide
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Form Buttons */}
            <div className="mt-8 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-orange-300 shadow-sm text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                } transition`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventCreationPage;
