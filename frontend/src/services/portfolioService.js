// src/services/portfolioService.js
import api from './api';

// Utility function to normalize data
const normalizeData = (data) => {
  if (!data) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      id: item._id || item.id,
      ...item,
    }));
  }
  
  return {
    id: data._id || data.id,
    ...data
  };
};

// Utility function to create form data for file uploads
const createFormData = (data, fileField, file) => {
  const formData = new FormData();
  
  // Add regular data fields
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  
  // Add file if provided
  if (file) {
    formData.append(fileField, file);
  }
  
  return formData;
};

// Utility function to handle multiple file uploads
const createMultiFileFormData = (data, fileField, files) => {
  const formData = new FormData();
  
  // Add regular data fields
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  
  // Add files if provided
  if (Array.isArray(files) && files.length > 0) {
    files.forEach((file, index) => {
      formData.append(`${fileField}[${index}]`, file);
    });
  }
  
  return formData;
};

const portfolioService = {
  // Get portfolio summary
  getPortfolioSummary: async (userId = null) => {
    try {
      const url = userId ? `/api/portfolio/summary?userId=${userId}` : '/api/portfolio/summary';
      
      const response = await api.get(url);
      
      if (!response.data) {
        throw new Error('Empty response received from server');
      }
      
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching portfolio summary:', error.response?.data || error.message);
      
      // Provide detailed error logging
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        console.error('No response received from server');
        console.warn('API might be unavailable, network issues or server down');
      }
      
      // If API is unavailable, we can return a minimal structure so the UI doesn't break
      if (!error.response || error.message === 'Network Error') {
        console.warn('API not available, returning empty portfolio summary structure');
        return {
          user: null,
          stats: {
            projects: { total: 0, public: 0, collaborations: 0 },
            achievements: { total: 0, public: 0, endorsed: 0 },
            streaks: { active: 0, completed: 0, totalCheckIns: 0 },
            recommendations: 0
          },
          skills: [],
          recentProjects: [],
          recentAchievements: [],
          activeStreaks: [],
          recommendations: []
        };
      }
      
      // For other types of errors, propagate them up
      throw error;
    }
  },

  // Get projects
  getProjects: async (userId) => {
    try {
      const url = userId ? `/api/projects?userId=${userId}` : '/api/projects';
      const response = await api.get(url);
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error.response?.data || error.message);
      
      // Return empty array if API is unavailable
      console.warn('API not available, returning empty projects array');
      return [];
    }
  },
  
  // Get a single project
  getProject: async (projectId) => {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      const response = await api.get(`/api/projects/${projectId}`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create a new project with improved file upload handling
  createProject: async (projectData, attachments = []) => {
    try {
      let response;
      
      // Check if we have valid attachments
      const validAttachments = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
      
      if (validAttachments.length > 0) {
        // Log attachment information for debugging
        console.log(`Uploading ${validAttachments.length} attachments`);
        
        try {
          // Create FormData for file uploads - with enhanced error handling
          const formData = createMultiFileFormData(projectData, 'attachments', validAttachments);
          
          // Send request with attachments
          console.log("Sending project with attachments to server");
          
          // Make the request with progress tracking
          response = await api.post('/api/projects', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              // Calculate and log upload progress
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 1)
              );
              console.log(`Upload progress: ${percentCompleted}%`);
            },
            // Extended timeout for large files
            timeout: 120000, // 2 minutes
          });
        } catch (uploadError) {
          console.error('File upload error:', uploadError.message);
          
          // If it's a timeout error, provide a clearer message
          if (uploadError.code === 'ECONNABORTED') {
            throw new Error('The upload timed out. Please try with fewer or smaller files.');
          }
          
          // If it's a network error, check connection and retry with text only
          if (uploadError.message === 'Network Error') {
            console.log('Network error during file upload. Attempting text-only submission...');
            
            // Try submitting without files as fallback
            const textOnlyData = { ...projectData, filesSkipped: true };
            response = await api.post('/api/projects', textOnlyData);
            
            // If we get here, the text-only submission worked
            console.log('Text-only submission successful');
            
            // Return with a warning
            return {
              ...normalizeData(response.data),
              warning: 'Project was created without files due to network issues. Please try uploading files later.'
            };
          }
          
          // If it's another error, rethrow
          throw uploadError;
        }
      } else {
        // No attachments, regular request
        response = await api.post('/api/projects', projectData);
      }
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response received from server');
      }
      
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error creating project:', error);
      
      // Enhanced error logging and handling
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
        
        // Format error message from server if available
        if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      } else if (error.request) {
        console.error('No response received from server');
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Rethrow with original message if no specific handling above
      throw error;
    }
  },
  
  // Update a project
  updateProject: async (projectId, projectData, attachments = []) => {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      let response;
      
      if (attachments && attachments.length > 0) {
        // Create enhanced FormData for file uploads
        const formData = createMultiFileFormData(projectData, 'attachments', attachments);
        
        // Send request with attachments
        response = await api.put(`/api/projects/${projectId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Send request without attachments
        response = await api.put(`/api/projects/${projectId}`, projectData);
      }
      
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error updating project ${projectId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete a project
  deleteProject: async (projectId) => {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      await api.delete(`/api/projects/${projectId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create an achievement with enhanced error handling
  createAchievement: async (achievementData, image = null) => {
    try {
      let response;
      
      if (image) {
        // Create FormData for image upload
        const formData = createFormData(achievementData, 'image', image);
        
        // Send request with image
        response = await api.post('/api/achievements', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Send request without image
        response = await api.post('/api/achievements', achievementData);
      }
      
      // Validate the response
      if (!response.data) {
        throw new Error('Empty response received from server');
      }
      
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error creating achievement:', error);
      // Add detailed error logging
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        console.error('No response received');
      }
      throw error;
    }
  },
  
  // Get achievements
  getAchievements: async (userId) => {
    try {
      const url = userId ? `/api/achievements?userId=${userId}` : '/api/achievements';
      const response = await api.get(url);
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching achievements:', error.response?.data || error.message);
      
      // Return empty array if API is unavailable
      console.warn('API not available, returning empty achievements array');
      return [];
    }
  },
  
  // Get a single achievement
  getAchievement: async (achievementId) => {
    try {
      if (!achievementId) {
        throw new Error('Achievement ID is required');
      }
      const response = await api.get(`/api/achievements/${achievementId}`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching achievement ${achievementId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update an achievement
  updateAchievement: async (achievementId, achievementData, image = null) => {
    try {
      if (!achievementId) {
        throw new Error('Achievement ID is required');
      }
      
      let response;
      
      if (image) {
        // Create enhanced FormData for image upload
        const formData = createFormData(achievementData, 'image', image);
        
        // Send request with image
        response = await api.put(`/api/achievements/${achievementId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Send request without image
        response = await api.put(`/api/achievements/${achievementId}`, achievementData);
      }
      
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error updating achievement ${achievementId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete an achievement
  deleteAchievement: async (achievementId) => {
    try {
      if (!achievementId) {
        throw new Error('Achievement ID is required');
      }
      await api.delete(`/api/achievements/${achievementId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting achievement ${achievementId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Endorse an achievement
  endorseAchievement: async (achievementId) => {
    try {
      if (!achievementId) {
        throw new Error('Achievement ID is required');
      }
      const response = await api.post(`/api/achievements/${achievementId}/endorse`);
      return response.data;
    } catch (error) {
      console.error(`Error endorsing achievement ${achievementId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Add a collaborator to a project
  addCollaborator: async (projectId, userId, role = 'contributor') => {
    try {
      if (!projectId || !userId) {
        throw new Error('Project ID and User ID are required');
      }
      const response = await api.post(`/api/projects/${projectId}/collaborators`, { userId, role });
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error adding collaborator to project ${projectId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Remove a collaborator from a project
  removeCollaborator: async (projectId, userId) => {
    try {
      if (!projectId || !userId) {
        throw new Error('Project ID and User ID are required');
      }
      await api.delete(`/api/projects/${projectId}/collaborators/${userId}`);
      return true;
    } catch (error) {
      console.error(`Error removing collaborator from project ${projectId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update collaborator permissions
  updateCollaboratorPermissions: async (projectId, userId, permissions) => {
    try {
      if (!projectId || !userId) {
        throw new Error('Project ID and User ID are required');
      }
      const response = await api.put(`/api/projects/${projectId}/collaborators/${userId}`, permissions);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error updating collaborator permissions:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create a streak
  createStreak: async (streakData) => {
    try {
      const response = await api.post('/api/streaks', streakData);
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error creating streak:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get streaks
  getStreaks: async () => {
    try {
      const response = await api.get('/api/streaks');
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching streaks:', error.response?.data || error.message);
      return [];
    }
  },
  
  // Get a single streak
  getStreak: async (streakId) => {
    try {
      if (!streakId) {
        throw new Error('Streak ID is required');
      }
      const response = await api.get(`/api/streaks/${streakId}`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching streak ${streakId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update a streak
  updateStreak: async (streakId, streakData) => {
    try {
      if (!streakId) {
        throw new Error('Streak ID is required');
      }
      const response = await api.put(`/api/streaks/${streakId}`, streakData);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error updating streak ${streakId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete a streak
  deleteStreak: async (streakId) => {
    try {
      if (!streakId) {
        throw new Error('Streak ID is required');
      }
      await api.delete(`/api/streaks/${streakId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting streak ${streakId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Check in to a streak
  checkInToStreak: async (streakId, evidence = null) => {
    try {
      if (!streakId) {
        throw new Error('Streak ID is required');
      }
      
      let response;
      
      if (evidence) {
        // Create FormData for evidence upload
        const formData = createFormData({}, 'evidence', evidence);
        
        // Send request with evidence
        response = await api.post(`/api/streaks/${streakId}/checkin`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Send request without evidence
        response = await api.post(`/api/streaks/${streakId}/checkin`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error checking in to streak ${streakId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Support someone's streak
  supportStreak: async (streakId) => {
    try {
      if (!streakId) {
        throw new Error('Streak ID is required');
      }
      const response = await api.post(`/api/streaks/${streakId}/support`);
      return response.data;
    } catch (error) {
      console.error(`Error supporting streak ${streakId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Add a skill
  addSkill: async (skillData) => {
    try {
      const response = await api.post('/api/skills', skillData);
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error adding skill:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get skills
  getSkills: async () => {
    try {
      const response = await api.get('/api/skills');
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error.response?.data || error.message);
      return [];
    }
  },
  
  // Get user skills
  getUserSkills: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await api.get(`/api/users/${userId}/skills`);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error fetching skills for user ${userId}:`, error.response?.data || error.message);
      return [];
    }
  },
  
  // Remove a skill
  removeSkill: async (skillId) => {
    try {
      if (!skillId) {
        throw new Error('Skill ID is required');
      }
      await api.delete(`/api/skills/${skillId}`);
      return true;
    } catch (error) {
      console.error(`Error removing skill ${skillId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Endorse a skill
  endorseSkill: async (userId, skillName) => {
    try {
      if (!userId || !skillName) {
        throw new Error('User ID and skill name are required');
      }
      const response = await api.post(`/api/users/${userId}/skills/${encodeURIComponent(skillName)}/endorse`);
      return response.data;
    } catch (error) {
      console.error(`Error endorsing skill:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Remove skill endorsement
  removeEndorsement: async (skillId) => {
    try {
      if (!skillId) {
        throw new Error('Skill ID is required');
      }
      const response = await api.delete(`/api/skills/${skillId}/endorse`);
      return response.data;
    } catch (error) {
      console.error(`Error removing skill endorsement:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create a recommendation
  createRecommendation: async (userId, recommendationData) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await api.post(`/api/users/${userId}/recommendations`, recommendationData);
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error creating recommendation:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get received recommendations
  getReceivedRecommendations: async () => {
    try {
      const response = await api.get('/api/recommendations/received');
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching received recommendations:', error.response?.data || error.message);
      return [];
    }
  },
  
  // Get given recommendations
  getGivenRecommendations: async () => {
    try {
      const response = await api.get('/api/recommendations/given');
      return normalizeData(response.data);
    } catch (error) {
      console.error('Error fetching given recommendations:', error.response?.data || error.message);
      return [];
    }
  },
  
  // Update a recommendation
  updateRecommendation: async (recommendationId, recommendationData) => {
    try {
      if (!recommendationId) {
        throw new Error('Recommendation ID is required');
      }
      const response = await api.put(`/api/recommendations/${recommendationId}`, recommendationData);
      return normalizeData(response.data);
    } catch (error) {
      console.error(`Error updating recommendation ${recommendationId}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete a recommendation
  deleteRecommendation: async (recommendationId) => {
    try {
      if (!recommendationId) {
        throw new Error('Recommendation ID is required');
      }
      await api.delete(`/api/recommendations/${recommendationId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting recommendation ${recommendationId}:`, error.response?.data || error.message);
      throw error;
    }
  }
};

export default portfolioService;