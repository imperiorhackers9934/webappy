// // 
// import React, { useState, useEffect } from 'react';
// import api from '../services/api';
// import { useNavigate } from 'react-router-dom';

// const ExploreUsers = () => {
//   const [loading, setLoading] = useState(true);
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [filterOptions, setFilterOptions] = useState({
//     industry: '',
//     skills: '',
//     location: '',
//     searchTerm: ''
//   });
//   const [pendingRequests, setPendingRequests] = useState({});
//   const navigate = useNavigate();

//   // Fetch all users from database
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         setLoading(true);
        
//         // Get all users - you may need to create this endpoint in your API
//         const response = await api.getAllUsers();
        
//         setUsers(response.users || []);
//         setFilteredUsers(response.users || []);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching users:', error);
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   // Apply filters whenever filter options change
//   useEffect(() => {
//     applyFilters();
//   }, [filterOptions, users]);

//   // Apply filters to users list
//   const applyFilters = () => {
//     let result = [...users];

//     // Apply industry filter
//     if (filterOptions.industry) {
//       result = result.filter(user => 
//         user.industry?.toLowerCase() === filterOptions.industry.toLowerCase()
//       );
//     }

//     // Apply skills filter
//     if (filterOptions.skills) {
//       const skillsArray = filterOptions.skills
//         .split(',')
//         .map(skill => skill.trim().toLowerCase())
//         .filter(skill => skill !== '');

//       result = result.filter(user => {
//         const userSkills = user.skills?.map(skill => 
//           typeof skill === 'string' 
//             ? skill.toLowerCase() 
//             : skill.name.toLowerCase()
//         ) || [];
        
//         return skillsArray.some(skill => userSkills.includes(skill));
//       });
//     }

//     // Apply location filter
//     if (filterOptions.location) {
//       result = result.filter(user => {
//         const userLocation = user.location?.address || 
//                             user.location?.city || 
//                             user.location?.country || '';
        
//         return userLocation.toLowerCase().includes(filterOptions.location.toLowerCase());
//       });
//     }

//     // Apply search term filter (searches name, title, company)
//     if (filterOptions.searchTerm) {
//       const searchLower = filterOptions.searchTerm.toLowerCase();
      
//       result = result.filter(user => {
//         const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
//         const title = (user.headline || user.title || '').toLowerCase();
//         const company = (user.company || '').toLowerCase();
        
//         return fullName.includes(searchLower) || 
//                title.includes(searchLower) || 
//                company.includes(searchLower);
//       });
//     }

//     setFilteredUsers(result);
//   };

//   // Handle filter changes
//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilterOptions(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // Clear all filters
//   const clearFilters = () => {
//     setFilterOptions({
//       industry: '',
//       skills: '',
//       location: '',
//       searchTerm: ''
//     });
//   };

//   // Handle sending connection request
//   const handleConnect = async (userId) => {
//     try {
//       // Track pending request in UI
//       setPendingRequests(prev => ({ ...prev, [userId]: true }));
      
//       // Send connection request
//       await api.sendConnectionRequest(userId);
      
//       // Update UI to show pending request
//       setPendingRequests(prev => ({ ...prev, [userId]: 'sent' }));
      
//       // Show success message (you might want to use a toast notification)
//       console.log('Connection request sent successfully');
//     } catch (error) {
//       console.error('Error sending connection request:', error);
//       setPendingRequests(prev => ({ ...prev, [userId]: false }));
//       // Show error message
//     }
//   };

//   // View a user's profile
//   const viewProfile = (userId) => {
//     // Record profile view
//     api.recordProfileView(userId);
    
//     // Navigate to profile page
//     navigate(`/profile/${userId}`);
//   };

//   // Render user card
//   const renderUserCard = (user) => {
//     const isPending = pendingRequests[user._id] === true;
//     const isRequested = pendingRequests[user._id] === 'sent';
    
//     return (
//       <div key={user._id} className="bg-white rounded-lg shadow overflow-hidden">
//         {/* Cover Image or Background */}
//         <div className="h-24 bg-gradient-to-r from-orange-100 to-orange-200"></div>
        
//         {/* Profile Info */}
//         <div className="p-4 relative">
//           {/* Profile Picture */}
//           <div className="absolute -top-12 left-4 border-4 border-white rounded-full">
//             {user.profilePicture ? (
//               <img 
//                 src={user.profilePicture} 
//                 alt={`${user.firstName} ${user.lastName}`}
//                 className="h-20 w-20 rounded-full object-cover"
//               />
//             ) : (
//               <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
//                 <span className="text-xl font-medium text-orange-600">
//                   {user.firstName?.charAt(0)}
//                   {user.lastName?.charAt(0)}
//                 </span>
//               </div>
//             )}
//             {user.isOnline && (
//               <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
//             )}
//           </div>
          
//           {/* User Details */}
//           <div className="mt-10">
//             <h3 
//               className="text-lg font-medium text-gray-900 hover:text-orange-600 cursor-pointer"
//               onClick={() => viewProfile(user._id)}
//             >
//               {user.firstName} {user.lastName}
//             </h3>
//             <p className="text-sm text-gray-600 truncate">
//               {user.headline || user.title || "Professional"}
//             </p>
            
//             <div className="mt-3 space-y-2">
//               {user.company && (
//                 <div className="flex items-center text-sm text-gray-600">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                   </svg>
//                   {user.company}
//                 </div>
//               )}
              
//               {(user.location?.address || user.location?.city || user.location?.country) && (
//                 <div className="flex items-center text-sm text-gray-600">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//                   </svg>
//                   {user.location?.address || user.location?.city || user.location?.country}
//                 </div>
//               )}
              
//               {/* Industry */}
//               {user.industry && (
//                 <div className="flex items-center text-sm text-gray-600">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                   {user.industry}
//                 </div>
//               )}
//             </div>
            
//             {/* Skills/Tags */}
//             {user.skills && user.skills.length > 0 && (
//               <div className="flex flex-wrap gap-1 mt-3">
//                 {user.skills.slice(0, 3).map((skill, index) => (
//                   <span key={index} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
//                     {typeof skill === 'string' ? skill : skill.name}
//                   </span>
//                 ))}
//                 {user.skills.length > 3 && (
//                   <span className="text-xs text-gray-500">+{user.skills.length - 3} more</span>
//                 )}
//               </div>
//             )}
            
//             {/* Connection Button */}
//             <button
//               onClick={() => handleConnect(user._id)}
//               disabled={isPending || isRequested}
//               className={`w-full mt-4 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
//                 isRequested 
//                   ? 'bg-gray-100 text-gray-500 cursor-default'
//                   : isPending
//                     ? 'bg-orange-300 text-white cursor-wait'
//                     : 'bg-orange-500 text-white hover:bg-orange-600'
//               }`}
//             >
//               {isRequested ? 'Connection Requested' : isPending ? 'Sending...' : 'Connect'}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-6">
//       <h1 className="text-2xl font-bold text-gray-900 mb-6">Explore Professionals</h1>
      
//       {/* Search and Filters */}
//       <div className="bg-white rounded-lg shadow p-4 mb-6">
//         <div className="flex justify-between items-center mb-3">
//           <h3 className="text-lg font-medium text-gray-900">Search & Filter</h3>
//           {(filterOptions.industry || filterOptions.skills || filterOptions.location || filterOptions.searchTerm) && (
//             <button 
//               onClick={clearFilters}
//               className="text-sm text-orange-600 hover:text-orange-800"
//             >
//               Clear All Filters
//             </button>
//           )}
//         </div>
        
//         {/* Search Bar */}
//         <div className="mb-4">
//           <div className="relative">
//             <input
//               type="text"
//               id="searchTerm"
//               name="searchTerm"
//               value={filterOptions.searchTerm}
//               onChange={handleFilterChange}
//               placeholder="Search by name, title, or company..."
//               className="w-full rounded-md pl-10 border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
//             />
//             <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//               </svg>
//             </div>
//           </div>
//         </div>
        
//         {/* Filter Controls */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div>
//             <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
//               Industry
//             </label>
//             <select
//               id="industry"
//               name="industry"
//               value={filterOptions.industry}
//               onChange={handleFilterChange}
//               className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
//             >
//               <option value="">All Industries</option>
//               <option value="technology">Technology</option>
//               <option value="healthcare">Healthcare</option>
//               <option value="finance">Finance</option>
//               <option value="education">Education</option>
//               <option value="marketing">Marketing</option>
//               <option value="retail">Retail</option>
//               <option value="manufacturing">Manufacturing</option>
//               <option value="hospitality">Hospitality</option>
//               <option value="consulting">Consulting</option>
//               <option value="real estate">Real Estate</option>
//               <option value="legal">Legal</option>
//               <option value="media">Media & Entertainment</option>
//               <option value="nonprofit">Non-profit</option>
//             </select>
//           </div>
          
//           <div>
//             <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
//               Skills
//             </label>
//             <input
//               type="text"
//               id="skills"
//               name="skills"
//               value={filterOptions.skills}
//               onChange={handleFilterChange}
//               placeholder="e.g. JavaScript, Marketing, Design"
//               className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
//             />
//           </div>
          
//           <div>
//             <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
//               Location
//             </label>
//             <input
//               type="text"
//               id="location"
//               name="location"
//               value={filterOptions.location}
//               onChange={handleFilterChange}
//               placeholder="e.g. New York, London, Remote"
//               className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
//             />
//           </div>
//         </div>
//       </div>
      
//       {/* Results Count */}
//       <div className="mb-4">
//         <p className="text-sm text-gray-600">
//           Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'professional' : 'professionals'}
//           {(filterOptions.industry || filterOptions.skills || filterOptions.location || filterOptions.searchTerm) && 
//             ' matching your filters'
//           }
//         </p>
//       </div>
      
//       {/* Loading State */}
//       {loading && (
//         <div className="flex justify-center items-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
//         </div>
//       )}
      
//       {/* User Grid */}
//       {!loading && filteredUsers.length > 0 && (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredUsers.map(user => renderUserCard(user))}
//         </div>
//       )}
      
//       {/* No Results */}
//       {!loading && filteredUsers.length === 0 && (
//         <div className="bg-white rounded-lg shadow p-8 text-center">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//           </svg>
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No matching professionals found</h3>
//           <p className="text-gray-600 mb-4">
//             Try adjusting your filters or search criteria to find more connections.
//           </p>
//           <button 
//             onClick={clearFilters}
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
//           >
//             Clear Filters
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ExploreUsers;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/common/Loader';
import UserCard from '../components/common/UserCard';

const SuggestedUsersPage = () => {
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
      setSuggestedUsers(response);
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
      // Update the user's status in the list
      setSuggestedUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, connectionStatus: 'pending' } 
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suggested Professionals</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => navigate('/network/nearby')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            View Nearby
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select
              name="industry"
              value={filters.industry}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md p-2"
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
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
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
            <div className="text-center py-10">
              <p className="text-gray-600">No suggestions found based on your profile and filters.</p>
              <p className="text-gray-600 mt-2">Try adjusting your filters or complete your profile for better recommendations.</p>
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
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuggestedUsersPage;