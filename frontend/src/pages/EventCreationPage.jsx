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
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import eventService from '../services/eventService';

const EventCreationPage = () => {
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
        navigate(`/events/${response.data._id || response.data.id}`);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Created Successfully!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your event has been created and is now visible to attendees.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(`/events/${response?.data?._id || response?.data?.id || 'new'}`)}
            >
              View Event
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => navigate('/events/new')}
            >
              Create Another Event
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/events')} 
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to Events</span>
                </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Create New Event</h1>
            <div>
              <button 
                type="button" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  {/* Event Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Tech Conference 2025"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Event Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Describe your event, what attendees can expect, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Tip: A good description helps attendees understand what to expect.
                    </p>
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex items-center">
                      <Tag className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="e.g., conference, technology, networking (comma separated)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Enter tags separated by commas to help people discover your event.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Date and Time Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Date and Time</h2>
                
                <div className="space-y-4">
                  {/* Start Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type="time"
                          id="startTime"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* End Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          min={formData.startDate} // Can't be earlier than start date
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type="time"
                          id="endTime"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
                
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isOnline" className="ml-2 block text-sm font-medium text-gray-700">
                        This is an online event
                      </label>
                    </div>
                    
                    {/* Virtual Meeting Link */}
                    {formData.isOnline && (
                      <div>
                        <label htmlFor="virtualMeetingLink" className="block text-sm font-medium text-gray-700 mb-1">
                          Virtual Meeting Link
                        </label>
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 text-gray-400 mr-2" />
                          <input
                            type="url"
                            id="virtualMeetingLink"
                            name="virtualMeetingLink"
                            value={formData.virtualMeetingLink}
                            onChange={handleInputChange}
                            placeholder="e.g., https://zoom.us/j/123456789"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Meeting link will only be shared with registered attendees.
                        </p>
                      </div>
                    )}
                    
                    {/* Physical Location */}
                    {!formData.isOnline && (
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                          Venue <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                          <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g., Tech Center"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={!formData.isOnline}
                          />
                        </div>
                        
                        <div className="mt-4">
                          <button
                            type="button"
                            className="text-sm text-blue-600 font-medium flex items-center"
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
                          <div className="mt-4 space-y-4">
                            <div>
                              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address
                              </label>
                              <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.locationDetails.address}
                                onChange={handleLocationDetailChange}
                                placeholder="e.g., 123 Main St"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                  City
                                </label>
                                <input
                                  type="text"
                                  id="city"
                                  name="city"
                                  value={formData.locationDetails.city}
                                  onChange={handleLocationDetailChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                  State/Province
                                </label>
                                <input
                                  type="text"
                                  id="state"
                                  name="state"
                                  value={formData.locationDetails.state}
                                  onChange={handleLocationDetailChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                                  Postal Code
                                </label>
                                <input
                                  type="text"
                                  id="postalCode"
                                  name="postalCode"
                                  value={formData.locationDetails.postalCode}
                                  onChange={handleLocationDetailChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                                  Country
                                </label>
                                <input
                                  type="text"
                                  id="country"
                                  name="country"
                                  value={formData.locationDetails.country}
                                  onChange={handleLocationDetailChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Cover Image</h2>
                
                {!formData.coverImagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label 
                          htmlFor="cover-image" 
                          className="cursor-pointer text-blue-600 font-medium hover:text-blue-500"
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
                        <p className="text-xs text-gray-500">
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
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-white text-gray-700 rounded-full p-1 shadow-sm hover:bg-gray-100"
                      onClick={handleClearImage}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                <p className="mt-2 text-sm text-gray-500">
                  A compelling cover image helps attract attendees to your event.
                </p>
              </div>
              
              {/* Event Settings Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Event Settings</h2>
                
                <div className="space-y-4">
                  {/* Capacity */}
                  <div>
                    <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Capacity
                    </label>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="number"
                        id="maxAttendees"
                        name="maxAttendees"
                        value={formData.maxAttendees}
                        onChange={handleInputChange}
                        min="1"
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Leave blank for unlimited capacity.
                    </p>
                  </div>
                  
                  {/* Visibility */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        name="isPrivate"
                        checked={formData.isPrivate}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPrivate" className="ml-2 block text-sm font-medium text-gray-700">
                        Private Event
                      </label>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 ml-6">
                      {formData.isPrivate ? (
                        <EyeOff className="w-4 h-4 mr-1" />
                      ) : (
                        <Eye className="w-4 h-4 mr-1" />
                      )}
                      <span>
                        {formData.isPrivate
                          ? 'Only visible to people you invite'
                          : 'Publicly visible to everyone'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Approval */}
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requireApproval"
                        name="requireApproval"
                        checked={formData.requireApproval}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requireApproval" className="ml-2 block text-sm font-medium text-gray-700">
                        Require approval for attendees
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 ml-6">
                      You'll need to manually approve each registration.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Helpful Tips Section */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Event Creation Tips</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Be specific in your event title and description</li>
                        <li>Choose the most relevant category for your event</li>
                        <li>Add a compelling cover image to attract attendees</li>
                        <li>Consider creating ticket types after creating your event</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
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
  );
};

export default EventCreationPage;