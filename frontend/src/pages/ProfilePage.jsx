import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import api from '../services/api';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  
  // Form state for profile editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    industry: '',
    location: '',
    bio: '',
    skills: []
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        let targetUserId = userId;
        
        // If no userId provided, show current user's profile
        if (!targetUserId && user) {
          targetUserId = user._id;
          setIsMyProfile(true);
        } else if (user && targetUserId === user._id) {
          setIsMyProfile(true);
        }
        
        if (!targetUserId) {
          navigate('/login');
          return;
        }
        
        const profileData = await api.getProfile(targetUserId);
        setProfile(profileData);
        
        // Initialize form data if it's the user's own profile
        if (isMyProfile) {
          setFormData({
            firstName: profileData.user.firstName || '',
            lastName: profileData.user.lastName || '',
            headline: profileData.user.headline || '',
            industry: profileData.user.industry || '',
            location: profileData.user.location?.address || '',
            bio: profileData.user.portfolio?.bio || '',
            skills: profileData.user.skills?.map(s => s.name) || []
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. ' + (error.response?.data?.error || error.message));
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, user, navigate, isMyProfile]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle skills input
  const handleSkillAdd = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      // Format skills for API
      const formattedSkills = formData.skills.map(name => ({ name }));
      
      // Build portfolio data
      const portfolioData = {
        bio: formData.bio
      };
      
      // Prepare the profile update data
      const profileUpdateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        headline: formData.headline,
        industry: formData.industry,
        skills: formattedSkills,
        portfolio: portfolioData
      };
      
      // Call API to update profile
      const updatedProfile = await api.updateProfile(profileUpdateData);
      
      // Update local state
      updateUser(updatedProfile);
      
      // Update profile state
      if (profile?.user) {
        setProfile(prev => ({
          ...prev,
          user: {
            ...prev.user,
            ...updatedProfile
          }
        }));
      }
      
      setEditing(false);
      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  // Handle connection request
  const handleConnect = async () => {
    try {
      if (!profile?.user?._id) return;
      
      await api.sendConnectionRequest(profile.user._id);
      
      // Update relationship status
      setProfile(prev => ({
        ...prev,
        relationshipStatus: {
          ...prev.relationshipStatus,
          isPending: true
        }
      }));
    } catch (error) {
      console.error('Error sending connection request:', error);
      setError('Failed to send connection request. ' + (error.response?.data?.error || error.message));
    }
  };

  // Handle following a user
  const handleFollow = async () => {
    try {
      if (!profile?.user?._id) return;
      
      const response = await api.followUser(profile.user._id);
      
      // Update relationship status based on API response
      setProfile(prev => ({
        ...prev,
        relationshipStatus: {
          ...prev.relationshipStatus,
          isFollowing: response.following
        }
      }));
    } catch (error) {
      console.error('Error following user:', error);
      setError('Failed to follow user. ' + (error.response?.data?.error || error.message));
    }
  };

  // Start a chat with the user
  const handleMessage = async () => {
    try {
      if (!profile?.user?._id) return;
      
      const chat = await api.createChat(profile.user._id);
      navigate(`/chat/${chat._id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to start conversation. ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} onLogout={logout} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} onLogout={logout} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={logout} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          {/* Cover Photo - Default gradient if none provided */}
          <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 relative">
            {/* Profile picture */}
            <div className="absolute bottom-0 transform translate-y-1/2 left-8">
              {profile?.user?.profilePicture ? (
                <img
                  src={profile.user.profilePicture}
                  alt={`${profile.user.firstName} ${profile.user.lastName}`}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center">
                  <span className="text-4xl font-semibold text-gray-600">
                    {profile?.user?.firstName?.charAt(0)}
                    {profile?.user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Action buttons for own profile */}
            {isMyProfile && (
              <div className="absolute bottom-4 right-4">
                {editing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md shadow-md"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}
            
            {/* Action buttons for other profiles */}
            {!isMyProfile && (
              <div className="absolute bottom-4 right-4 flex space-x-2">
                {profile?.relationshipStatus?.isConnected ? (
                  <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md shadow-md cursor-default">
                    Connected
                  </button>
                ) : profile?.relationshipStatus?.isPending ? (
                  <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md shadow-md cursor-default">
                    Request Sent
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md"
                  >
                    Connect
                  </button>
                )}
                
                <button
                  onClick={handleFollow}
                  className={`${
                    profile?.relationshipStatus?.isFollowing 
                      ? 'bg-gray-200 text-gray-800' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  } px-4 py-2 rounded-md shadow-md`}
                >
                  {profile?.relationshipStatus?.isFollowing ? 'Following' : 'Follow'}
                </button>
                
                <button
                  onClick={handleMessage}
                  className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-500 px-4 py-2 rounded-md shadow-md"
                >
                  Message
                </button>
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="pt-16 px-8 pb-8">
            {editing ? (
              /* Editing Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="headline">
                    Headline
                  </label>
                  <input
                    type="text"
                    id="headline"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Software Engineer at Tech Company"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="industry">
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Media">Media</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                        <span className="mr-1">{skill}</span>
                        <button 
                          type="button" 
                          onClick={() => handleSkillRemove(skill)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add a skill"
                      className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSkillAdd(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        handleSkillAdd(input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.user?.firstName} {profile?.user?.lastName}
                </h1>
                <p className="text-gray-600 mt-1">{profile?.user?.headline || 'No headline'}</p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-500">
                  {profile?.user?.industry && (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{profile.user.industry}</span>
                    </div>
                  )}
                  
                  {profile?.user?.location?.address && (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{profile.user.location.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>
                      {profile?.user?.connections?.length || 0} connections
                    </span>
                  </div>
                </div>
                
                {/* Skills */}
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile?.user?.skills?.length > 0 ? (
                      profile.user.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No skills listed</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Profile Content Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('experience')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'experience'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Experience
              </button>
              <button
                onClick={() => setActiveTab('education')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'education'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Education
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {profile?.user?.portfolio?.bio || 'No bio information provided yet.'}
                </p>
              </div>
            )}
            
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio</h3>
                
                {profile?.portfolio?.projects?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.portfolio.projects.map((project, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-lg text-gray-900">{project.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{project.category}</p>
                        <p className="text-gray-700 mt-2">{project.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No projects to display</p>
                )}
              </div>
            )}
            
            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Work Experience</h3>
                
                {profile?.user?.portfolio?.workExperience?.length > 0 ? (
                  <div className="space-y-6">
                    {profile.user.portfolio.workExperience.map((experience, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                        <h4 className="font-semibold text-gray-900">{experience.position}</h4>
                        <p className="text-gray-700">{experience.company}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {new Date(experience.startDate).toLocaleDateString()} - 
                          {experience.current 
                            ? ' Present' 
                            : experience.endDate 
                              ? ` ${new Date(experience.endDate).toLocaleDateString()}` 
                              : ''
                          }
                        </p>
                        {experience.description && (
                          <p className="text-gray-700 mt-2">{experience.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No work experience listed</p>
                )}
              </div>
            )}
            
            {/* Education Tab */}
            {activeTab === 'education' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Education</h3>
                
                {profile?.user?.portfolio?.education?.length > 0 ? (
                  <div className="space-y-6">
                    {profile.user.portfolio.education.map((education, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                        <h4 className="font-semibold text-gray-900">{education.institution}</h4>
                        <p className="text-gray-700">{education.degree}{education.field ? `, ${education.field}` : ''}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {new Date(education.startDate).toLocaleDateString()} - 
                          {education.current 
                            ? ' Present' 
                            : education.endDate 
                              ? ` ${new Date(education.endDate).toLocaleDateString()}` 
                              : ''
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No education listed</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
          </div>
          
          <div className="p-6">
            {profile?.recommendations?.length > 0 ? (
              <div className="space-y-6">
                {profile.recommendations.map((recommendation, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start mb-2">
                      {recommendation.author.profilePicture ? (
                        <img
                          src={recommendation.author.profilePicture}
                          alt={`${recommendation.author.firstName} ${recommendation.author.lastName}`}
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-lg font-semibold text-gray-600">
                            {recommendation.author.firstName?.charAt(0)}
                            {recommendation.author.lastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                      <div>
  <h4 className="font-semibold text-gray-800">{recommendation.author.firstName} {recommendation.author.lastName}</h4>
  <p className="text-gray-500 text-sm">{recommendation.author.headline || 'Connection'}</p>
</div>
</div>
</div>
<p className="text-gray-700">{recommendation.content}</p>
<p className="text-gray-500 text-xs mt-2">{new Date(recommendation.createdAt).toLocaleDateString()}</p>
</div>
))}
</div>
) : (
<div>
<p className="text-gray-500">No recommendations yet</p>
{!isMyProfile && profile?.relationshipStatus?.isConnected && (
  <div className="mt-4">
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md"
      onClick={() => navigate(`/recommend/${profile.user._id}`)}
    >
      Write a Recommendation
    </button>
  </div>
)}
</div>
)}
</div>
</div>

{/* Activity Feed */}
<div className="bg-white shadow rounded-lg overflow-hidden mb-6">
<div className="px-6 py-4 border-b border-gray-200">
<h3 className="text-lg font-medium text-gray-900">Activity</h3>
</div>

<div className="p-6">
{profile?.activity?.length > 0 ? (
  <div className="space-y-6">
    {profile.activity.map((activity, index) => (
      <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {activity.type === 'post' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              ) : activity.type === 'connection' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              )}
            </svg>
          </div>
          <div>
            <p className="text-gray-700">{activity.content}</p>
            <p className="text-gray-500 text-xs mt-1">{new Date(activity.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-500">No recent activity</p>
)}
</div>
</div>
</div>

<Footer />
</div>
);
};

export default ProfilePage;
