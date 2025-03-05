import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { FaCamera } from 'react-icons/fa';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    email: '',
    phoneNumber: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
    },
    about: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      website: '',
    },
    skills: []
  });
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  
  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user info
        const userInfo = await api.getUserInfo();
        setCurrentUser(userInfo);
        
        // Get detailed profile
        const profileData = await api.getProfile(userInfo._id);
        
        // Populate form with current data
        const user = profileData.user;
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          headline: user.headline || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          location: {
            address: user.location?.address || '',
            city: user.location?.city || '',
            state: user.location?.state || '',
            country: user.location?.country || '',
          },
          about: user.portfolio?.about || '',
          socialLinks: {
            linkedin: user.socialLinks?.linkedin || '',
            twitter: user.socialLinks?.twitter || '',
            website: user.socialLinks?.website || '',
          },
          skills: user.skills?.map(skill => skill.name) || []
        });
        
        if (user.profilePicture) {
          setProfilePicturePreview(user.profilePicture);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects (location, socialLinks)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field if exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle skills input (comma separated)
  const handleSkillsChange = (e) => {
    const skillsString = e.target.value;
    const skillsArray = skillsString.split(',')
      .map(skill => skill.trim())
      .filter(skill => skill !== '');
    
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    
    // Email validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    // URL validations for social links
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
    
    if (formData.socialLinks.linkedin && !urlRegex.test(formData.socialLinks.linkedin)) {
      errors.socialLinks = { ...errors.socialLinks, linkedin: 'Please enter a valid URL' };
    }
    
    if (formData.socialLinks.twitter && !urlRegex.test(formData.socialLinks.twitter)) {
      errors.socialLinks = { ...errors.socialLinks, twitter: 'Please enter a valid URL' };
    }
    
    if (formData.socialLinks.website && !urlRegex.test(formData.socialLinks.website)) {
      errors.socialLinks = { ...errors.socialLinks, website: 'Please enter a valid URL' };
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for API
      const profileData = {
        ...formData,
        // Convert skills array to correct format for API
        skills: formData.skills.map(name => ({ name }))
      };
      
      // If there's a new profile picture, we need to handle it separately
      if (profilePicture) {
        const formDataWithImage = new FormData();
        
        // Add the profile picture
        formDataWithImage.append('profileImage', profilePicture);
        
        // Add other fields
        Object.entries(profileData).forEach(([key, value]) => {
          // Skip the profilePicture field to avoid conflicts
          if (key === 'profilePicture') return;
          
          if (typeof value === 'object' && value !== null) {
            formDataWithImage.append(key, JSON.stringify(value));
          } else {
            formDataWithImage.append(key, value);
          }
        });
        
        // Use direct fetch for more reliable file upload
        const response = await fetch(`${api.baseURL}/api/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataWithImage
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update profile');
        }
      } else {
        // If no new profile picture, use the regular API method
        // Make sure to exclude profilePicture from the data
        const { profilePicture: _, ...dataToUpdate } = profileData;
        await api.updateProfile(dataToUpdate);
      }
      
      setSaving(false);
      
      // Navigate back to profile page
      navigate(`/profile/${currentUser._id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaving(false);
      
      // Handle API error
      if (error.response && error.response.data) {
        setFormErrors({
          api: error.response.data.message || 'An error occurred while updating your profile'
        });
      } else {
        setFormErrors({
          api: error.message || 'Network error. Please try again.'
        });
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <Link 
          to={`/profile/${currentUser?._id}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </Link>
      </div>
      
      {formErrors.api && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {formErrors.api}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex items-center">
              <div className="relative">
                <img 
                  src={profilePicturePreview || 'https://via.placeholder.com/128'} 
                  alt="Profile Preview" 
                  className="h-32 w-32 rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full cursor-pointer">
                  <FaCamera />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfilePictureChange} 
                    className="hidden"
                  />
                </label>
              </div>
              <div className="ml-6">
                <p className="text-sm text-gray-600">
                  Upload a clear, professional photo of yourself.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or GIF, max 5MB.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name*
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                    formErrors.firstName ? 'border-red-300' : ''
                  }`}
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name*
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                    formErrors.lastName ? 'border-red-300' : ''
                  }`}
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="headline" className="block text-sm font-medium text-gray-700">
                  Professional Headline
                </label>
                <input
                  type="text"
                  id="headline"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g., Full Stack Developer at Tech Company"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A short description of your professional role or expertise
                </p>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                    formErrors.email ? 'border-red-300' : ''
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Location Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  id="location.address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="location.city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  type="text"
                  id="location.state"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label htmlFor="location.country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  id="location.country"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* About */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
            <div>
              <textarea
                id="about"
                name="about"
                rows={6}
                value={formData.about}
                onChange={handleChange}
                placeholder="Tell us about yourself, your background, expertise, and professional interests..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
        
        {/* Social Links */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Social Links</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="socialLinks.linkedin" className="block text-sm font-medium text-gray-700">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  id="socialLinks.linkedin"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/your-profile"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                    formErrors.socialLinks?.linkedin ? 'border-red-300' : ''
                  }`}
                />
                {formErrors.socialLinks?.linkedin && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.socialLinks.linkedin}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="socialLinks.twitter" className="block text-sm font-medium text-gray-700">
                  Twitter Profile
                </label>
                <input
                  type="url"
                  id="socialLinks.twitter"
                  name="socialLinks.twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/your-handle"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                    formErrors.socialLinks?.twitter ? 'border-red-300' : ''
                  }`}
                />
                {formErrors.socialLinks?.twitter && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.socialLinks.twitter}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="socialLinks.website" className="block text-sm font-medium text-gray-700">
                  Personal Website
                </label>
                <input
                  type="url"
                  id="socialLinks.website"
                  name="socialLinks.website"
                  value={formData.socialLinks.website}
                  onChange={handleChange}
                  placeholder="https://your-website.com"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                    formErrors.socialLinks?.website ? 'border-red-300' : ''
                  }`}
                />
                {formErrors.socialLinks?.website && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.socialLinks.website}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Skills */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
            <div>
              <textarea
                id="skills"
                rows={3}
                value={formData.skills.join(', ')}
                onChange={handleSkillsChange}
                placeholder="Enter skills separated by commas (e.g., React, JavaScript, UX Design)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                List your professional skills, technologies, or areas of expertise separated by commas
              </p>
            </div>
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Link 
            to={`/profile/${currentUser?._id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ${
              saving ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;