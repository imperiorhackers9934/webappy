import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { FaLinkedin, FaTwitter, FaGlobe, FaEnvelope, FaPhone } from 'react-icons/fa';
import Loader from '../components/common/Loader';
import ProfileViewCard from '../components/profile/ProfileViewCard';
import ConnectionButton from '../components/network/ConnectionButton';
import Sidebar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const ProfilePage = () => {
    const { userId } = useParams(); // This might be undefined if visiting /profile
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth(); // Get current user from auth context
    const [profile, setProfile] = useState(null);
    const [userRelationship, setUserRelationship] = useState({});
    const [portfolio, setPortfolio] = useState({});
    const [recommendations, setRecommendations] = useState([]);
    const [activeTab, setActiveTab] = useState('about');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewsAnalytics, setViewsAnalytics] = useState(null);
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [currentUserInfo, setCurrentUserInfo] = useState(null);
  
    // Memoized fetch function to avoid recreation on each render
   // Modified fetchUserData function to handle the API response structure correctly
const fetchUserData = useCallback(async () => {
  try {
    console.log("Starting to fetch profile data...");
    setLoading(true);
    setError(null); // Reset any previous errors
    
    // If we're on the edit route, skip profile fetch
    if (location.pathname.endsWith('/edit')) {
      console.log("Edit route detected, skipping profile fetch");
      setLoading(false);
      return;
    }
    
    // First, get the current user's info using getCurrentUser
    console.log("Fetching current user info...");
    try {
      const currentUserResponse = await userService.get('/api/me');
      const userInfo = currentUserResponse.data;
      console.log("Current user info fetched:", userInfo);
      setCurrentUserInfo(userInfo);
      
      // If no userId is provided in URL, redirect to current user's profile
      if (!userId || userId === 'undefined') {
        console.log("No userId provided, redirecting to current user profile");
        if (userInfo && userInfo._id) {
          navigate(`/profile/${userInfo._id}`, { replace: true });
          return; // Exit early as we're redirecting
        } else {
          setError('Could not determine your user ID');
          setLoading(false);
          return;
        }
      }
      
      // Check if we're viewing our own profile
      const isSelf = userInfo._id === userId;
      console.log(`Viewing profile ${userId}, is self: ${isSelf}`);
      setIsCurrentUser(isSelf);
      
      // Now fetch the requested profile
      console.log(`Fetching profile data for user ${userId}...`);
      const profileData = await userService.getUserProfile(userId);
      console.log("Profile data fetched:", profileData);
      
      // Handle the API response correctly
      // Check if profileData is the user object directly (not nested)
      if (profileData && profileData.id) {
        // If the API returns the user directly (not nested under 'user')
        console.log("API returned user object directly, using it as profile");
        setProfile(profileData);
        // Since relationship status might not be included, default to empty object
        setUserRelationship({});
        // Portfolio and recommendations might be nested properties of the user object
        setPortfolio(profileData.portfolio || {});
        setRecommendations(profileData.recommendations || []);
      } else if (profileData && profileData.user) {
        // If the API returns with expected nested structure
        console.log("API returned expected nested structure");
        setProfile(profileData.user);
        setUserRelationship(profileData.relationshipStatus || {});
        setPortfolio(profileData.portfolio || {});
        setRecommendations(profileData.recommendations || []);
      } else {
        // Invalid data received
        console.error("Invalid profile data received:", profileData);
        setError('Received invalid profile data');
        setLoading(false);
        return;
      }
      
      // Record view if not our own profile
      if (!isSelf) {
        try {
          await api.recordProfileView(userId);
        } catch (viewError) {
          console.error('Failed to record profile view:', viewError);
        }
      } else {
        // Get our own view analytics
        try {
          const analytics = await api.getProfileViewAnalytics('month');
          setViewsAnalytics(analytics);
        } catch (analyticsError) {
          console.error('Failed to get view analytics:', analyticsError);
        }
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data. Please ensure you have a valid user ID.');
      setLoading(false);
    }
  } catch (err) {
    console.error('Unexpected error in fetchUserData:', err);
    setError('An unexpected error occurred');
    setLoading(false);
  }
}, [userId, navigate, location.pathname]);

    // Add this effect to handle when profile is loaded but loading state is still true
    useEffect(() => {
      if (profile && loading) {
        console.log("Profile loaded but still in loading state - forcing update");
        setLoading(false);
      }
    }, [profile, loading]);
    
    useEffect(() => {
      // If we're on the edit route, we should handle it differently
      if (location.pathname.endsWith('/edit')) {
        console.log("Edit route detected, skipping profile fetch");
        return; // Don't fetch profile data on the edit route
      }
      
      console.log(`ProfilePage: useEffect triggered with userId=${userId}`);
      fetchUserData();
    }, [userId, location.pathname, fetchUserData]);
    
    // Log state changes to debug
    useEffect(() => {
      console.log("Profile state changed:", { 
        loading, 
        error, 
        hasProfile: !!profile, 
        isCurrentUser 
      });
    }, [loading, error, profile, isCurrentUser]);
    
    // If we're on the edit route, render the profile editor instead
    if (location.pathname.endsWith('/edit')) {
      return (
        <div className="flex h-screen bg-orange-50">
          <Sidebar user={user} />
          <div className="flex-1 overflow-auto">
            <div className="md:pl-0 pl-0 md:pt-0 pt-16">
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
                {/* Your profile editor component or form should go here */}
                <div className="bg-white rounded-lg shadow p-6 mt-4">
                  <p>Edit profile form would go here</p>
                  <Link 
                    to={`/profile/${currentUserInfo?._id || ''}`}
                    className="mt-4 inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  
    if (loading) {
      console.log("Rendering loading state");
      return (
        <div className="flex h-screen bg-orange-50">
          <Sidebar user={user} />
          <div className="flex-1 overflow-auto">
            <div className="md:pl-0 pl-0 md:pt-0 pt-16 flex justify-center items-center h-64">
              <Loader />
            </div>
          </div>
        </div>
      );
    }
    
    if (error) {
      console.log("Rendering error state:", error);
      return (
        <div className="flex h-screen bg-orange-50">
          <Sidebar user={user} />
          <div className="flex-1 overflow-auto">
            <div className="md:pl-0 pl-0 md:pt-0 pt-16 flex justify-center items-center h-64">
              <div className="text-center text-red-500">{error}</div>
            </div>
          </div>
        </div>
      );
    }
    
    if (!profile) {
      console.log("Rendering 'profile not found' state");
      return (
        <div className="flex h-screen bg-orange-50">
          <Sidebar user={user} />
          <div className="flex-1 overflow-auto">
            <div className="md:pl-0 pl-0 md:pt-0 pt-16 flex justify-center items-center h-64">
              <div className="text-center">Profile not found</div>
            </div>
          </div>
        </div>
      );
    }

  console.log("Rendering complete profile");
  return (
    <div className="flex h-screen bg-orange-50">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <div className="md:pl-0 pl-0 md:pt-0 pt-16">
          <div className="container mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Cover Image */}
              <div 
                className="h-48 w-full bg-gradient-to-r from-orange-500 to-orange-600"
              ></div>
              
              <div className="relative px-4 py-5 sm:px-6">
                {/* Profile Picture */}
                <div className="absolute -mt-16">
                  <img
                    className="h-32 w-32 rounded-full ring-4 ring-white"
                    src={profile.profilePicture || 'https://via.placeholder.com/128'}
                    alt={`${profile.firstName} ${profile.lastName}`}
                  />
                </div>

                {/* Profile Actions */}
                <div className="flex justify-end mb-4">
                  {!isCurrentUser && (
                    <div className="space-x-2">
                      <ConnectionButton 
                        userId={userId} 
                        initialStatus={userRelationship}
                        onStatusChange={(newStatus) => setUserRelationship(newStatus)} 
                      />
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Message
                      </button>
                    </div>
                  )}
                  {isCurrentUser && (
                    <Link to="/profile/edit" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                      Edit Profile
                    </Link>
                  )}
                </div>

                {/* Profile Info */}
                <div className="mt-6 pt-10">
                  <h1 className="text-3xl font-bold">
                    {profile.firstName} {profile.lastName}
                    {profile.verification?.isVerified && (
                      <span className="ml-2 text-orange-500">✓</span>
                    )}
                  </h1>
                  <p className="text-xl text-gray-600 mt-1">{profile.headline}</p>
                  <p className="text-gray-500 mt-1">
                    {profile.location?.address || 'No location specified'}
                  </p>

                  {/* Stats & Connection Info */}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                    <span>{profile.connections?.length || 0} connections</span>
                    <span>{profile.followers?.length || 0} followers</span>
                    
                    {isCurrentUser && viewsAnalytics && (
                      <Link to="/profile/views" className="text-orange-600 hover:underline">
                        {viewsAnalytics.totalViews} profile views in the last month
                      </Link>
                    )}
                  </div>

                  {/* Quick Contact */}
                  <div className="mt-4 flex gap-3">
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} className="text-gray-600 hover:text-orange-600">
                        <FaEnvelope size={20} />
                      </a>
                    )}
                    {profile.phoneNumber && (
                      <a href={`tel:${profile.phoneNumber}`} className="text-gray-600 hover:text-orange-600">
                        <FaPhone size={20} />
                      </a>
                    )}
                    {profile.socialLinks?.linkedin && (
                      <a href={profile.socialLinks.linkedin} className="text-gray-600 hover:text-orange-600" target="_blank" rel="noopener noreferrer">
                        <FaLinkedin size={20} />
                      </a>
                    )}
                    {profile.socialLinks?.twitter && (
                      <a href={profile.socialLinks.twitter} className="text-gray-600 hover:text-orange-600" target="_blank" rel="noopener noreferrer">
                        <FaTwitter size={20} />
                      </a>
                    )}
                    {profile.socialLinks?.website && (
                      <a href={profile.socialLinks.website} className="text-gray-600 hover:text-orange-600" target="_blank" rel="noopener noreferrer">
                        <FaGlobe size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile who viewed card (for own profile) */}
            {isCurrentUser && viewsAnalytics && (
              <div className="mt-6">
                <ProfileViewCard analytics={viewsAnalytics} />
              </div>
            )}

            {/* Profile Tabs */}
            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'about'
                        ? 'border-b-2 border-orange-500 text-orange-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('experience')}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'experience'
                        ? 'border-b-2 border-orange-500 text-orange-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Experience
                  </button>
                  <button
                    onClick={() => setActiveTab('education')}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'education'
                        ? 'border-b-2 border-orange-500 text-orange-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Education
                  </button>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'skills'
                        ? 'border-b-2 border-orange-500 text-orange-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Skills
                  </button>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'portfolio'
                        ? 'border-b-2 border-orange-500 text-orange-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Portfolio
                  </button>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'recommendations'
                        ? 'border-b-2 border-orange-500 text-orange-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Recommendations
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* About Tab */}
                {activeTab === 'about' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">About</h2>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {profile.portfolio?.about || 'No information provided.'}
                    </div>
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Work Experience</h2>
                    {profile.portfolio?.workExperience?.length > 0 ? (
                      <div className="space-y-6">
                        {profile.portfolio.workExperience.map((experience, index) => (
                          <div key={index} className="border-b pb-4 last:border-0">
                            <div className="flex items-start">
                              <div className="h-12 w-12 flex-shrink-0 bg-gray-200 rounded-md flex items-center justify-center">
                                {experience.companyLogo ? (
                                  <img src={experience.companyLogo} alt={experience.company} className="h-10 w-10 object-contain" />
                                ) : (
                                  <span className="text-gray-500 text-xl">{experience.company?.charAt(0)}</span>
                                )}
                              </div>
                              <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-800">{experience.position}</h3>
                                <p className="text-gray-600">{experience.company}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(experience.startDate).toLocaleDateString('en-US', { 
                                    month: 'short', year: 'numeric' 
                                  })} - {
                                    experience.current 
                                      ? 'Present' 
                                      : new Date(experience.endDate).toLocaleDateString('en-US', { 
                                          month: 'short', year: 'numeric' 
                                        })
                                  }
                                </p>
                                <p className="mt-2 text-gray-700">{experience.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No work experience listed.</p>
                    )}
                  </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Education</h2>
                    {profile.portfolio?.education?.length > 0 ? (
                      <div className="space-y-6">
                        {profile.portfolio.education.map((education, index) => (
                          <div key={index} className="border-b pb-4 last:border-0">
                            <div className="flex items-start">
                              <div className="h-12 w-12 flex-shrink-0 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-500 text-xl">{education.institution?.charAt(0)}</span>
                              </div>
                              <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-800">{education.institution}</h3>
                                <p className="text-gray-600">{education.degree}{education.field ? `, ${education.field}` : ''}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(education.startDate).toLocaleDateString('en-US', { year: 'numeric' })} - {
                                    education.current 
                                      ? 'Present' 
                                      : new Date(education.endDate).toLocaleDateString('en-US', { year: 'numeric' })
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No education information listed.</p>
                    )}
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Skills</h2>
                    {profile.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <div key={index} className="bg-orange-50 rounded-full px-4 py-2 text-gray-700 border border-orange-200">
                            {skill.name} {skill.endorsements > 0 && `(${skill.endorsements})`}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No skills listed.</p>
                    )}
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Portfolio</h2>
                      {isCurrentUser && (
                        <Link to="/portfolio/add" className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition">
                          Add Project
                        </Link>
                      )}
                    </div>
                    
                    {portfolio.projects?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {portfolio.projects.map((project, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden bg-white">
                            {project.images && project.images[0] && (
                              <img 
                                src={project.images[0]} 
                                alt={project.title} 
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="p-4">
                              <h3 className="text-lg font-medium text-gray-800">{project.title}</h3>
                              <p className="text-gray-500 mt-1">{project.category}</p>
                              <p className="text-gray-700 mt-2 line-clamp-3">{project.description}</p>
                              <Link 
                                to={`/portfolio/${project._id}`} 
                                className="mt-3 inline-block text-orange-600 hover:underline"
                              >
                                View Project
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No projects added yet.</p>
                    )}
                    
                    {/* Achievements Section */}
                    {portfolio.achievements?.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievements</h3>
                        <div className="space-y-4">
                          {portfolio.achievements.map((achievement, index) => (
                            <div key={index} className="flex items-start p-4 border rounded-lg bg-white">
                              {achievement.image ? (
                                <img src={achievement.image} alt="" className="h-16 w-16 object-contain" />
                              ) : (
                                <div className="h-16 w-16 bg-orange-100 text-orange-800 flex items-center justify-center rounded-full">
                                  <span className="text-xl">🏆</span>
                                </div>
                              )}
                              <div className="ml-4">
                                <h4 className="text-md font-medium text-gray-800">{achievement.title}</h4>
                                <p className="text-sm text-gray-600">{achievement.issuer} • {new Date(achievement.dateAchieved).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-700 mt-1">{achievement.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Recommendations</h2>
                      {!isCurrentUser && (
                        <button className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition">
                          Write a Recommendation
                        </button>
                      )}
                    </div>
                    
                    {recommendations?.length > 0 ? (
                      <div className="space-y-6">
                        {recommendations.map((recommendation, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center mb-4">
                              <img 
                                src={recommendation.author.profilePicture || 'https://via.placeholder.com/40'} 
                                alt="" 
                                className="h-10 w-10 rounded-full"
                              />
                              <div className="ml-3">
                                <h3 className="text-md font-medium text-gray-800">
                                  {recommendation.author.firstName} {recommendation.author.lastName}
                                </h3>
                                <p className="text-sm text-gray-500">{recommendation.relationship}</p>
                              </div>
                            </div>
                            <p className="text-gray-700">{recommendation.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No recommendations yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;