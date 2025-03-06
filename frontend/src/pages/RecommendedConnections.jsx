import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/common/Loader';
import UserCard from '../components/common/UserCard';
import Sidebar from '../components/common/Navbar';

const SuggestedUsersPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [filters, setFilters] = useState({
    industry: '',
    skills: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    setLoading(true);
    try {
      const response = await api.getProfessionalSuggestions(filters);
      
      // Filter out connected users, pending connections, and self
      const filteredUsers = response.filter(suggUser => {
        // Filter out self
        if (suggUser._id === user?._id) return false;
        
        // Filter out already connected users
        if (suggUser.isConnected || suggUser.connectionStatus === 'connected') return false;
        
        return true;
      });
      
      setSuggestedUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchSuggestedUsers();
  };

  const handleConnect = async (userId) => {
    try {
      await api.sendConnectionRequest(userId);
      // Update the user's status in the list to show 'pending' instead of 'connect'
      setSuggestedUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, connectionStatus: 'pending', isPending: true } 
            : user
        )
      );
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await api.followUser(userId);
      // Update the user's status in the list
      setSuggestedUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: response.following } 
            : user
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Industries list for filter dropdown
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 
    'Marketing', 'Sales', 'Design', 'Engineering', 
    'Consulting', 'Legal', 'Real Estate', 'Hospitality'
  ];

  return (
    <div className="flex h-screen bg-orange-50">
      {/* Sidebar */}
      <Sidebar user={user} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="md:pl-0 pl-0 md:pt-0 pt-16"> {/* Adjusted for sidebar */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Suggested Professionals</h1>
              <div className="flex space-x-4">
                <button 
                  onClick={() => navigate('/network/nearby')}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                >
                  View Nearby
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-orange-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    name="industry"
                    value={filters.industry}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Industries</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={filters.skills}
                    onChange={handleFilterChange}
                    placeholder="e.g. React, Marketing, Design"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleApplyFilters}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader />
              </div>
            ) : (
              <>
                {suggestedUsers.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-lg shadow-md p-8">
                    <div className="bg-orange-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">No suggestions found based on your profile and filters.</p>
                    <p className="text-gray-600 mt-2">Try adjusting your filters or complete your profile for better recommendations.</p>
                    <button 
                      onClick={() => navigate('/profile')} 
                      className="mt-4 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition"
                    >
                      Complete Your Profile
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestedUsers.map(user => (
                      <UserCard
                        key={user._id}
                        user={user}
                        onConnect={() => handleConnect(user._id)}
                        onFollow={() => handleFollow(user._id)}
                        onViewProfile={() => handleViewProfile(user._id)}
                        theme="orange"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsersPage;
