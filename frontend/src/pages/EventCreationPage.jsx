import { useState, useEffect } from 'react';
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
  AlertCircle,
  Menu,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import eventService from '../services/eventService';
import Sidebar from '../components/common/Navbar';  // Import the Sidebar component

const EventCreationPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1280);
  
  // Check window size on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarCollapsed(window.innerWidth < 1280);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form sections
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
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  if (success) {
    return (
      <div className="flex min-h-screen bg-orange-50">
        {/* Include Sidebar */}
        {!isMobile && <Sidebar user={user} onLogout={onLogout} />}
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${!isMobile ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''}`}>
          {/* Mobile Header */}
          {isMobile && (
            <div className="sticky top-0 z-30 bg-white shadow-md border-b border-orange-200">
              <div className="flex items-center justify-between p-4">
                <Link to="/events" className="flex items-center text-orange-600">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span>Back</span>
                </Link>
                <h1 className="text-lg font-semibold text-orange-900">Success!</h1>
                <button
                  onClick={toggleMobileMenu}
                  className="text-orange-600 p-1 rounded-md hover:bg-orange-100"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
            <div className="text-center bg-white rounded-2xl shadow-lg p-8 border border-orange-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                <CheckCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-orange-900 mb-4">Event Created Successfully!</h1>
              <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mb-4"></div>
              <p className="text-lg text-gray-700 mb-8 max-w-md mx-auto">
                Your event has been created and is now visible to attendees. You can now set up tickets and share your event!
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300"
                  onClick={() => navigate(`/events/${response?.data?._id || response?.data?.id || 'new'}`)}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Event
                </button>
                <button 
                  className="inline-flex items-center justify-center px-6 py-3 border border-orange-300 text-base font-medium rounded-lg shadow-sm text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300"
                  onClick={() => navigate('/events/new')}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Another Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render different form sections based on active step
  const renderFormSection = () => {
    switch(activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
              <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-orange-500" />
                Basic Information
              </h2>
              
              <div className="space-y-6">
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
                    className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
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
                    className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                  />
                  <p className="mt-2 text-sm text-orange-600 italic">
                    Tip: A good description helps attendees understand what to expect.
                  </p>
                </div>
                
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900 appearance-none"
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
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex items-center">
                    <Tag className="w-5 h-5 text-orange-500 absolute ml-3" />
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="e.g., conference, technology, networking (comma separated)"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                    />
                  </div>
                  <p className="mt-2 text-sm text-orange-600 italic">
                    Enter tags separated by commas to help people discover your event.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
              <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                Date and Time
              </h2>
              
              <div className="space-y-6">
                {/* Start Date and Time */}
                <div>
                  <h3 className="text-base font-medium text-gray-700 mb-3">When does your event start?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 text-orange-500 absolute top-3 left-3" />
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <div className="relative">
                        <Clock className="w-5 h-5 text-orange-500 absolute top-3 left-3" />
                        <input
                          type="time"
                          id="startTime"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* End Date and Time */}
                <div>
                  <h3 className="text-base font-medium text-gray-700 mb-3">When does your event end?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 text-orange-500 absolute top-3 left-3" />
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          min={formData.startDate} // Can't be earlier than start date
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <div className="relative">
                        <Clock className="w-5 h-5 text-orange-500 absolute top-3 left-3" />
                        <input
                          type="time"
                          id="endTime"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        If your event has no specific end time, you can leave the end date and time fields empty.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
              <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                Location
              </h2>
              
              <div className="space-y-6">
                {/* Event Type (Online/In-Person) */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="isOnline"
                      name="isOnline"
                      checked={formData.isOnline}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-orange-300 rounded transition"
                    />
                    <label htmlFor="isOnline" className="ml-2 block text-base font-medium text-gray-800">
                      This is an online event
                    </label>
                  </div>
                </div>
                
                {/* Virtual Meeting Link */}
                {formData.isOnline && (
                  <div className="p-5 bg-white rounded-lg border border-orange-200 shadow-sm">
                    <h3 className="text-base font-medium text-gray-700 mb-3">Online Meeting Details</h3>
                    <label htmlFor="virtualMeetingLink" className="block text-sm font-medium text-gray-700 mb-1">
                      Virtual Meeting Link
                    </label>
                    <div className="relative">
                      <Globe className="w-5 h-5 text-orange-500 absolute top-3 left-3" />
                      <input
                        type="url"
                        id="virtualMeetingLink"
                        name="virtualMeetingLink"
                        value={formData.virtualMeetingLink}
                        onChange={handleInputChange}
                        placeholder="e.g., https://zoom.us/j/123456789"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                      />
                    </div>
                    <p className="mt-2 text-sm text-orange-600">
                      Meeting link will only be shared with registered attendees.
                    </p>
                  </div>
                )}
                
                {/* Physical Location */}
                {!formData.isOnline && (
                  <div className="p-5 bg-white rounded-lg border border-orange-200 shadow-sm">
                    <h3 className="text-base font-medium text-gray-700 mb-3">Venue Details</h3>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 text-orange-500 absolute top-3 left-3" />
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Tech Center"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                        required={!formData.isOnline}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <button
                        type="button"
                        className="text-sm text-orange-600 font-medium flex items-center hover:text-orange-800 transition bg-orange-50 px-3 py-2 rounded-md"
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
                      <div className="mt-4 space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
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
                            className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={type="text"
                              id="city"
                              name="city"
                              value={formData.locationDetails.city}
                              onChange={handleLocationDetailChange}
                              className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
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
                              className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
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
                              className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
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
        );
        
      case 4:
        return (
          <div className="space-y-6">
            {/* Cover Image Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
              <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2 text-orange-500" />
                Cover Image
              </h2>
              
              {!formData.coverImagePreview ? (
                <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 bg-orange-50 hover:bg-orange-100 transition-all duration-300 cursor-pointer">
                  <div className="text-center">
                    <Upload className="mx-auto h-16 w-16 text-orange-400" />
                    <div className="mt-4">
                      <label 
                        htmlFor="cover-image" 
                        className="cursor-pointer inline-block px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg shadow-sm hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
                      >
                        Choose Image
                        <input 
                          id="cover-image" 
                          name="coverImage" 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only" 
                        />
                      </label>
                      <p className="mt-2 text-sm text-orange-600">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={formData.coverImagePreview} 
                    alt="Event cover preview" 
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-30"></div>
                  <button
                    type="button"
                    className="absolute top-3 right-3 bg-white text-orange-700 rounded-full p-2 shadow-md hover:bg-orange-100 transition-all duration-300"
                    onClick={handleClearImage}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <p className="mt-3 text-sm text-orange-600 italic">
                A compelling cover image helps attract attendees to your event.
              </p>
            </div>
            
            {/* Event Settings Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-200 hover:shadow-md transition">
              <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-orange-500" />
                Event Settings
              </h2>
              
              <div className="space-y-6">
                {/* Capacity */}
                <div>
                  <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Capacity
                  </label>
                  <div className="relative">
                    <Users className="w-5 h-5 text-orange-500 absolute top-3 left-3" />
                    <input
                      type="number"
                      id="maxAttendees"
                      name="maxAttendees"
                      value={formData.maxAttendees}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="Unlimited"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm transition text-gray-900"
                    />
                  </div>
                  <p className="mt-2 text-sm text-orange-600 italic">
                    Leave blank for unlimited capacity.
                  </p>
                </div>
              
                {/* Privacy Settings */}
                <div className="border-t border-orange-200 pt-5 mt-5">
                  <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-orange-500" />
                    Privacy Settings
                  </h3>
                  
                  <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                    {/* Private Event */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="isPrivate"
                          name="isPrivate"
                          checked={formData.isPrivate}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-orange-300 rounded transition"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="isPrivate" className="font-medium text-gray-700">
                          Private event
                        </label>
                        <p className="text-gray-500">Only visible to invited guests</p>
                      </div>
                    </div>
                    
                    {/* Require Approval */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="requireApproval"
                          name="requireApproval"
                          checked={formData.requireApproval}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-orange-300 rounded transition"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="requireApproval" className="font-medium text-gray-700">
                          Require approval for attendees
                        </label>
                        <p className="text-gray-500">Manually approve each registration</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-2 p-3 bg-white rounded-lg border border-orange-200">
                      <Info className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                      <span>
                        Private events won't appear in search results or event listings.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Help Section */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-xl p-5 shadow-md text-white">
              <h3 className="font-medium mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Need Help?
              </h3>
              <p className="text-sm mb-3 text-white">
                Our event creation guide provides tips for creating successful events.
              </p>
              <a 
                href="/help/event-creation" 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-sm font-medium text-white hover:text-orange-100 flex items-center transition bg-white bg-opacity-20 p-2 rounded-lg mt-2"
              >
                View Event Creation Guide
                <ChevronRight className="ml-1 w-4 h-4" />
              </a>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Include Sidebar on non-mobile screens */}
      {!isMobile && <Sidebar user={user} onLogout={onLogout} />}
      
      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-75 z-40"
          onClick={toggleMobileMenu}
        ></div>
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
          <Sidebar user={user} onLogout={onLogout} />
        </div>
      )}
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${!isMobile ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''}`}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white shadow-md border-b border-orange-200">
          {isMobile ? (
            <div className="flex items-center justify-between p-4">
              <Link to="/events" className="flex items-center text-orange-600">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back</span>
              </Link>
              <div className="text-center">
                <h1 className="text-lg font-semibold text-orange-900">Create Event</h1>
                <div className="text-xs text-gray-500 mt-0.5">Step {activeStep} of {formSteps.length}</div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="text-orange-600 p-1 rounded-md hover:bg-orange-100"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          ) : (
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
                    disabled={submitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress Bar - Desktop */}
          {!isMobile && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <div className="flex justify-between">
                {formSteps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`flex items-center ${step.id < activeStep ? 'text-orange-600' : step.id === activeStep ? 'text-orange-900' : 'text-gray-400'}`}
                    onClick={() => step.id < activeStep && setActiveStep(step.id)}
                    style={{ cursor: step.id < activeStep ? 'pointer' : 'default' }}
                  >
                    <div 
                      className={`rounded-full w-8 h-8 flex items-center justify-center ${
                        step.id < activeStep 
                          ? 'bg-orange-600 text-white' 
                          : step.id === activeStep 
                          ? 'bg-orange-100 text-orange-800 border-2 border-orange-500' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {step.id < activeStep ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="ml-2 text-sm font-medium">{step.name}</span>
                    {step.id !== formSteps.length && (
                      <div className={`w-full h-1 mx-2 ${step.id < activeStep ? 'bg-orange-500' : 'bg-gray-200'}`} style={{ width: '3rem' }}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Progress Bar - Mobile */}
          {isMobile && (
            <div className="px-4 pb-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-orange-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(activeStep / formSteps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            {/* Render active form section */}
            {renderFormSection()}
            
            {/* Form Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStepChange('prev')}
                className={`px-5 py-2.5 border border-orange-300 shadow-sm text-sm font-medium rounded-lg text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition ${
                  activeStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={activeStep === 1}
              >
                Previous
              </button>
              
              {activeStep < formSteps.length ? (
                <button
                  type="button"
                  onClick={() => handleStepChange('next')}
                  className="px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white ${
                    submitting 
                      ? 'bg-orange-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition`}
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
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Event
                    </>
                  )}
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
