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
  Users,
  CheckCircle,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import eventService from '../services/eventService';
import Sidebar from '../components/common/Navbar';  // Import the existing Sidebar component

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
  
  // Form navigation
  const nextStep = () => {
    if (validateStep() && activeStep < formSteps.length) {
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
    setError(null);
    
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validate all steps before submission
    for (let i = 1; i <= formSteps.length; i++) {
      setActiveStep(i);
      if (!validateStep()) {
        return;
      }
    }
    
    try {
      setSubmitting(true);
      
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
  
  // Render content for current step
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
                    onClick={handleClearImage}
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
  
  // Success state render
  if (success) {
    return (
      <div className="flex h-screen">
        {/* Integrate the existing Sidebar */}
        <Sidebar user={user} onLogout={onLogout} />
        
        {/* Main content with no gap */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center bg-white rounded-lg shadow-md p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                <CheckCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-orange-900 mb-4">Event Created Successfully!</h1>
              <p className="text-lg text-gray-700 mb-8">
                Your event has been created and is now visible to attendees.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button 
                  className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
                  onClick={() => navigate(`/events/${response?.data?._id || response?.data?.id || 'new'}`)}
                >
                  View Event
                </button>
                <button 
                  className="px-6 py-2 border border-orange-300 text-base font-medium rounded-md shadow-sm text-orange-700 bg-white hover:bg-orange-50"
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
    <div className="flex">
      {/* The sidebar component - moved higher in the z-index stack */}
      <div className="z-20 relative">
        <Sidebar user={user} onLogout={onLogout} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-16 py-4 flex items-center justify-between">
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
            <div className="px-4 pb-4">
              <div className="flex justify-between">
                {formSteps.map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`flex items-center ${index < formSteps.length - 1 ? 'flex-1' : ''}`}
                    onClick={() => step.id <= activeStep ? setActiveStep(step.id) : null}
                    style={{ cursor: step.id <= activeStep ? 'pointer' : 'default' }}
                  >
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
                      <div className={`h-0.5 flex-1 mx-3 ${activeStep > step.id ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
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
