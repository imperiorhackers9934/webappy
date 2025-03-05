import React, { useState, useRef } from 'react';
import api from '../../services/api';

const CreatePost = ({ onPostCreated, user }) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showPollForm, setShowPollForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [visibility, setVisibility] = useState('public');
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 10) {
      setError('You can upload maximum 10 files');
      return;
    }
    
    setMediaFiles(files);
    
    // Create previews
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      name: file.name
    }));
    
    setMediaPreview(previews);
    
    // Set post type based on file type
    if (files.length > 0) {
      setPostType(files[0].type.startsWith('image/') ? 'image' : 'video');
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreview];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setMediaFiles(newFiles);
    setMediaPreview(newPreviews);
    
    // Reset post type if no files left
    if (newFiles.length === 0) {
      setPostType('text');
    } else {
      setPostType(newFiles[0].type.startsWith('image/') ? 'image' : 'video');
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const togglePollForm = () => {
    setShowPollForm(!showPollForm);
    if (!showPollForm) {
      setPostType('poll');
    } else {
      setPostType('text');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Validate form
      if (!content && mediaFiles.length === 0 && !linkUrl && !showPollForm) {
        setError('Please add some content, media, or link');
        setLoading(false);
        return;
      }
      
      if (showPollForm) {
        // Validate poll options
        const validOptions = pollOptions.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          setError('Please provide at least 2 poll options');
          setLoading(false);
          return;
        }
      }
      
      // Create FormData
      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', postType);
      formData.append('visibility', visibility);
      
      // Add media files
      if (mediaFiles.length > 0) {
        mediaFiles.forEach(file => {
          formData.append('media', file);
        });
        
        // Add captions if any
        const captions = {};
        mediaFiles.forEach((file, index) => {
          captions[index] = '';
        });
        formData.append('captions', JSON.stringify(captions));
      }
      
      // Add poll data if applicable
      if (showPollForm) {
        const validOptions = pollOptions.filter(opt => opt.trim() !== '');
        const pollData = {
          question: content,
          options: validOptions,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
          allowMultipleVotes: false
        };
        formData.append('pollData', JSON.stringify(pollData));
      }
      
      // Add link data if applicable
      if (linkUrl) {
        formData.append('linkUrl', linkUrl);
      }
      
      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      const hashtags = [];
      let match;
      while ((match = hashtagRegex.exec(content)) !== null) {
        hashtags.push(match[1]);
      }
      
      if (hashtags.length > 0) {
        formData.append('tags', hashtags.join(','));
      }
      
      // Submit post
      const newPost = await api.createPost(formData);
      
      // Reset form
      setContent('');
      setMediaFiles([]);
      setMediaPreview([]);
      setPostType('text');
      setShowPollForm(false);
      setPollOptions(['', '']);
      setLinkUrl('');
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated(newPost);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.response?.data?.error || 'Failed to create post');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start space-x-4">
        {/* User avatar */}
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={`${user.firstName} ${user.lastName}`}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-600">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </span>
          </div>
        )}

        {/* Post form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}

            {/* Content input */}
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder={showPollForm ? "Ask a question..." : "What's on your mind?"}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            ></textarea>

            {/* Link URL input */}
            {postType === 'link' && (
              <div className="mt-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Enter URL"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Poll options */}
            {showPollForm && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium text-gray-700">Poll Options</h3>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handlePollOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                
                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Add Option
                  </button>
                )}
              </div>
            )}

            {/* Media preview */}
            {mediaPreview.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">Media Preview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mediaPreview.map((media, index) => (
                    <div key={index} className="relative">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={`Preview ${index}`}
                          className="h-24 w-full object-cover rounded-lg border border-gray-300"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="h-24 w-full object-cover rounded-lg border border-gray-300"
                          controls
                        ></video>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post actions */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-4">
                {/* Media upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4a.5.5 0 01-.5-.5v-6.501l2-1.646 2.646 2.646a1 1 0 001.414 0L14 7.354V14.5a.5.5 0 01-.5.5zM4 4.5A.5.5 0 014.5 4h11a.5.5 0 01.5.5v2.691l-3.5-3.396a1 1 0 00-1.391-.013L6.12 8.695 4 6.859V4.5z" clipRule="evenodd" />
                  </svg>
                  Photo/Video
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                />

                {/* Link button */}
                <button
                  type="button"
                  onClick={() => setPostType(postType === 'link' ? 'text' : 'link')}
                  className={`flex items-center ${postType === 'link' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  Link
                </button>

                {/* Poll button */}
                <button
                  type="button"
                  onClick={togglePollForm}
                  className={`flex items-center ${showPollForm ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  Poll
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Visibility dropdown */}
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="border border-gray-300 rounded-lg text-sm p-1"
                >
                  <option value="public">Public</option>
                  <option value="connections">Connections</option>
                  <option value="private">Private</option>
                </select>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2"
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;