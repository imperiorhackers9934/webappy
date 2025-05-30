// src/pages/CustomFormCreatorPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import customEventService from '../services/customeventService';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer'; // Updated to common/Footer
import eventService from '../services/eventService';

const CustomFormCreatorPage = () => {
  const { eventId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [event, setEvent] = useState(null);
  const [existingForm, setExistingForm] = useState(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState('Registration Form');
  const [formDescription, setFormDescription] = useState('');
  const [formSections, setFormSections] = useState([
    { sectionId: 'section-' + Date.now(), title: 'Basic Information', description: '', order: 0 }
  ]);
  const [formFields, setFormFields] = useState([]);
  const [formSettings, setFormSettings] = useState({
    allowSubmissionAfterStart: true,
    notifyOnSubmission: true,
    autoApprove: true,
    maxSubmissions: null,
    preventDuplicateSubmissions: true
  });
  
  useEffect(() => {
    const fetchEventAndForm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch event details to check permissions
        const eventResponse = await eventService.getEvent(eventId);
        
        // Check if we got an error response
        if (eventResponse.error) {
          throw new Error(eventResponse.error);
        }
        
        // Get the event data (normalized by the service)
        const eventData = eventResponse.data;
        
        if (!eventData) {
          throw new Error('Failed to fetch event details');
        }
        
        setEvent(eventData);
        // Check if the user is the creator or a host
        const isCreator = eventData.createdBy && eventData.createdBy._id === user.id;
        console.log("creator", eventData.createdBy._id)
        console.log(user.id)
        const isHost = eventData.attendees && eventData.attendees.some(
          a => a.user === user.id && a.role === 'host'
        );
        
        if (!isCreator && !isHost) {
          setError('You do not have permission to create a custom form for this event');
          setLoading(false);
          return;
        }
        
        // Check if a form already exists
        try {
          const formResponse = await customEventService.getCustomForm(eventId);
          setExistingForm(formResponse);
          
          // Pre-populate form fields if a form exists
          if (formResponse) {
            setFormTitle(formResponse.title || 'Registration Form');
            setFormDescription(formResponse.description || '');
            setFormSections(formResponse.sections && formResponse.sections.length > 0 
              ? formResponse.sections 
              : [{ sectionId: 'section-' + Date.now(), title: 'Basic Information', description: '', order: 0 }]);
            setFormFields(formResponse.fields || []);
            setFormSettings(formResponse.settings || {
              allowSubmissionAfterStart: true,
              notifyOnSubmission: true,
              autoApprove: true,
              preventDuplicateSubmissions: true
            });
          }
        } catch (formError) {
          // It's okay if the form doesn't exist yet
          console.log('No existing form found, creating new one');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event or form:', error);
        setError('Failed to load event data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchEventAndForm();
  }, [eventId, token, user.id]);
  
  const handleAddSection = () => {
    const newSection = {
      sectionId: 'section-' + Date.now(),
      title: 'New Section',
      description: '',
      order: formSections.length
    };
    
    setFormSections([...formSections, newSection]);
  };
  
  const handleUpdateSection = (index, field, value) => {
    const updatedSections = [...formSections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    setFormSections(updatedSections);
  };
  
  const handleDeleteSection = (index) => {
    // Check if section has fields
    const hasFields = formFields.some(field => 
      field.uiConfig && field.uiConfig.section === formSections[index].sectionId
    );
    
    if (hasFields) {
      if (!window.confirm('This section contains fields. Deleting it will also delete those fields. Continue?')) {
        return;
      }
      
      // Remove fields from this section
      const updatedFields = formFields.filter(field => 
        !field.uiConfig || field.uiConfig.section !== formSections[index].sectionId
      );
      setFormFields(updatedFields);
    }
    
    const updatedSections = formSections.filter((_, i) => i !== index);
    setFormSections(updatedSections);
  };
  
  const handleAddField = (sectionId) => {
    const newField = {
      fieldId: 'field-' + Date.now(),
      label: 'New Field',
      type: 'text',
      placeholder: '',
      required: false,
      uiConfig: {
        width: 'full',
        section: sectionId,
        order: formFields.filter(f => 
          f.uiConfig && f.uiConfig.section === sectionId
        ).length
      }
    };
    
    setFormFields([...formFields, newField]);
  };
  
  const handleUpdateField = (index, field, value) => {
    const updatedFields = [...formFields];
    
    // Special handling for type changes
    if (field === 'type') {
      // Reset field-specific properties when changing type
      const currentType = updatedFields[index].type;
      
      // Remove options from non-choice fields
      if (currentType === 'select' || currentType === 'multiselect' || 
          currentType === 'radio' || currentType === 'checkbox') {
        if (value !== 'select' && value !== 'multiselect' && 
            value !== 'radio' && value !== 'checkbox') {
          delete updatedFields[index].options;
        }
      }
      
      // Add options when changing to choice fields
      if ((value === 'select' || value === 'multiselect' || 
           value === 'radio' || value === 'checkbox') && 
          !updatedFields[index].options) {
        updatedFields[index].options = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ];
      }
      
      // Add fileConfig when changing to file type
      if (value === 'file' && !updatedFields[index].fileConfig) {
        updatedFields[index].fileConfig = {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          multiple: false
        };
      }
    }
    
    // Handle options update
    if (field.startsWith('option-')) {
      const [, optionIndex, optionField] = field.split('-');
      
      if (!updatedFields[index].options) {
        updatedFields[index].options = [];
      }
      
      if (!updatedFields[index].options[optionIndex]) {
        updatedFields[index].options[optionIndex] = { label: '', value: '' };
      }
      
      updatedFields[index].options[optionIndex][optionField] = value;
    } else {
      // Regular field update
      updatedFields[index] = {
        ...updatedFields[index],
        [field]: value
      };
    }
    
    setFormFields(updatedFields);
  };
  
  const handleAddOption = (fieldIndex) => {
    const updatedFields = [...formFields];
    
    if (!updatedFields[fieldIndex].options) {
      updatedFields[fieldIndex].options = [];
    }
    
    updatedFields[fieldIndex].options.push({
      label: `Option ${updatedFields[fieldIndex].options.length + 1}`,
      value: `option${updatedFields[fieldIndex].options.length + 1}`
    });
    
    setFormFields(updatedFields);
  };
  
  const handleDeleteOption = (fieldIndex, optionIndex) => {
    const updatedFields = [...formFields];
    updatedFields[fieldIndex].options = updatedFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFormFields(updatedFields);
  };
  
  const handleDeleteField = (index) => {
    const updatedFields = formFields.filter((_, i) => i !== index);
    setFormFields(updatedFields);
  };
  
  const handleUpdateSettings = (field, value) => {
    setFormSettings({
      ...formSettings,
      [field]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = {
        title: formTitle,
        description: formDescription,
        sections: formSections,
        fields: formFields,
        settings: formSettings
      };
      
      let response;
      
      if (existingForm) {
        // Update existing form
        response = await customEventService.updateCustomForm(eventId, existingForm._id, formData);
        setSuccess('Form updated successfully!');
      } else {
        // Create new form
        response = await customEventService.createCustomForm(eventId, formData);
        setExistingForm(response.form);
        setSuccess('Form created successfully!');
      }
      
      console.log('Form saved:', response);
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error saving form:', error);
      setError(error.response?.data?.error || 'Failed to save form. Please try again.');
      
      // Scroll to top to show error message
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !event) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error && !event) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded"
          >
            Back to Events
          </button>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* <Navbar /> */}
      <div className="flex-grow container mx-auto px-24 py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">Custom Registration Form</h1>
            <h2 className="text-gray-600">For event: {event?.name}</h2>
          </div>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
          >
            Back to Event
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          {/* Form Title and Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-orange-600">Form Settings</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="formTitle">
                Form Title
              </label>
              <input
                id="formTitle"
                type="text"
                className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-orange-500"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="formDescription">
                Form Description
              </label>
              <textarea
                id="formDescription"
                className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-orange-500"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows="3"
              />
            </div>
          </div>
          
          {/* Form Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-orange-600">Registration Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center mb-2">
                <input
                  id="allowSubmissionAfterStart"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  checked={formSettings.allowSubmissionAfterStart || false}
                  onChange={(e) => handleUpdateSettings('allowSubmissionAfterStart', e.target.checked)}
                />
                <label htmlFor="allowSubmissionAfterStart" className="ml-2 block text-sm text-gray-700">
                  Allow registrations after event starts
                </label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  id="notifyOnSubmission"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  checked={formSettings.notifyOnSubmission || false}
                  onChange={(e) => handleUpdateSettings('notifyOnSubmission', e.target.checked)}
                />
                <label htmlFor="notifyOnSubmission" className="ml-2 block text-sm text-gray-700">
                  Notify me when someone registers
                </label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  id="autoApprove"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  checked={formSettings.autoApprove || false}
                  onChange={(e) => handleUpdateSettings('autoApprove', e.target.checked)}
                />
                <label htmlFor="autoApprove" className="ml-2 block text-sm text-gray-700">
                  Auto-approve registrations
                </label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  id="preventDuplicateSubmissions"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  checked={formSettings.preventDuplicateSubmissions || false}
                  onChange={(e) => handleUpdateSettings('preventDuplicateSubmissions', e.target.checked)}
                />
                <label htmlFor="preventDuplicateSubmissions" className="ml-2 block text-sm text-gray-700">
                  Prevent duplicate registrations
                </label>
              </div>
              <div className="mb-2">
                <label htmlFor="maxSubmissions" className="block text-sm font-medium text-gray-700">
                  Maximum number of registrations (0 = unlimited)
                </label>
                <input
                  id="maxSubmissions"
                  type="number"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  value={formSettings.maxSubmissions || 0}
                  onChange={(e) => handleUpdateSettings('maxSubmissions', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="submissionDeadline" className="block text-sm font-medium text-gray-700">
                  Registration deadline (optional)
                </label>
                <input
                  id="submissionDeadline"
                  type="datetime-local"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  value={formSettings.submissionDeadline || ''}
                  onChange={(e) => handleUpdateSettings('submissionDeadline', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Form Sections */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-orange-600">Form Sections</h2>
              <button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded text-sm flex items-center"
                onClick={handleAddSection}
              >
                + Add Section
              </button>
            </div>
            
            {formSections.map((section, index) => (
              <div key={section.sectionId} className="mb-6 p-4 border rounded-lg bg-orange-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-grow">
                    <input
                      type="text"
                      className="text-lg font-semibold w-full px-2 py-1 border rounded focus:outline-none focus:border-orange-500"
                      value={section.title}
                      onChange={(e) => handleUpdateSection(index, 'title', e.target.value)}
                      placeholder="Section Title"
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-red-500"
                      onClick={() => handleDeleteSection(index)}
                      title="Delete Section"
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                    value={section.description}
                    onChange={(e) => handleUpdateSection(index, 'description', e.target.value)}
                    placeholder="Section Description (optional)"
                  />
                </div>
                
                {/* Fields in this section */}
                <div className="ml-4 border-l-2 border-orange-200 pl-4">
                  <h3 className="text-md font-medium mb-2 text-orange-700">Fields in this section</h3>
                  
                  {formFields.filter(field => 
                    field.uiConfig && field.uiConfig.section === section.sectionId
                  ).map((field, fieldIndex) => {
                    const globalFieldIndex = formFields.findIndex(f => f.fieldId === field.fieldId);
                    return (
                      <div key={field.fieldId} className="mb-4 p-3 border rounded bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-orange-700">{field.label || 'Unnamed Field'}</div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              className="text-gray-500 hover:text-red-500"
                              onClick={() => handleDeleteField(globalFieldIndex)}
                              title="Delete Field"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Field Label</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                              value={field.label || ''}
                              onChange={(e) => handleUpdateField(globalFieldIndex, 'label', e.target.value)}
                              placeholder="Field Label"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
                            <select
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                              value={field.type}
                              onChange={(e) => handleUpdateField(globalFieldIndex, 'type', e.target.value)}
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="email">Email</option>
                              <option value="date">Date</option>
                              <option value="time">Time</option>
                              <option value="select">Dropdown</option>
                              <option value="multiselect">Multi-select</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="radio">Radio Button</option>
                              <option value="textarea">Text Area</option>
                              <option value="file">File Upload</option>
                              <option value="phone">Phone Number</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                              value={field.placeholder || ''}
                              onChange={(e) => handleUpdateField(globalFieldIndex, 'placeholder', e.target.value)}
                              placeholder="Placeholder text"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Help Text</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                              value={field.helpText || ''}
                              onChange={(e) => handleUpdateField(globalFieldIndex, 'helpText', e.target.value)}
                              placeholder="Help text (optional)"
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              checked={field.required || false}
                              onChange={(e) => handleUpdateField(globalFieldIndex, 'required', e.target.checked)}
                              id={`required-${field.fieldId}`}
                            />
                            <label htmlFor={`required-${field.fieldId}`} className="ml-2 block text-xs text-gray-700">
                              Required field
                            </label>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                            <select
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                              value={(field.uiConfig && field.uiConfig.width) || 'full'}
                              onChange={(e) => {
                                const updatedUiConfig = { ...(field.uiConfig || {}), width: e.target.value };
                                handleUpdateField(globalFieldIndex, 'uiConfig', updatedUiConfig);
                              }}
                            >
                              <option value="full">Full Width</option>
                              <option value="half">Half Width</option>
                              <option value="third">One Third</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Options for select, multiselect, checkbox, radio */}
                        {(field.type === 'select' || field.type === 'multiselect' || 
                         field.type === 'checkbox' || field.type === 'radio') && (
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-xs font-medium text-gray-700">Options</label>
                              <button
                                type="button"
                                className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 py-1 px-2 rounded flex items-center"
                                onClick={() => handleAddOption(globalFieldIndex)}
                              >
                                + Add Option
                              </button>
                            </div>
                            {field.options && field.options.map((option, optionIndex) => (
                              <div key={`option-${optionIndex}`} className="flex items-center mb-2">
                                <div className="flex-grow grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                                    value={option.label || ''}
                                    onChange={(e) => handleUpdateField(
                                      globalFieldIndex, 
                                      `option-${optionIndex}-label`, 
                                      e.target.value
                                    )}
                                    placeholder="Label"
                                  />
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                                    value={option.value || ''}
                                    onChange={(e) => handleUpdateField(
                                      globalFieldIndex, 
                                      `option-${optionIndex}-value`, 
                                      e.target.value
                                    )}
                                    placeholder="Value"
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="ml-2 text-gray-500 hover:text-red-500"
                                  onClick={() => handleDeleteOption(globalFieldIndex, optionIndex)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* File upload configuration */}
                        {field.type === 'file' && (
                          <div className="mt-3">
                            <h4 className="text-xs font-medium text-gray-700 mb-2">File Upload Settings</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Max File Size (in bytes)</label>
                                <input
                                  type="number"
                                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                                  value={(field.fileConfig && field.fileConfig.maxSize) || 5242880}
                                  onChange={(e) => {
                                    const fileConfig = { ...(field.fileConfig || {}), maxSize: parseInt(e.target.value) };
                                    handleUpdateField(globalFieldIndex, 'fileConfig', fileConfig);
                                  }}
                                  placeholder="Max file size in bytes"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {(field.fileConfig?.maxSize || 5242880) / (1024 * 1024)} MB
                                </p>
                              </div>
                              <div className="flex items-center">
                              <input
                                  type="checkbox"
                                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  checked={(field.fileConfig && field.fileConfig.multiple) || false}
                                  onChange={(e) => {
                                    const fileConfig = { ...(field.fileConfig || {}), multiple: e.target.checked };
                                    handleUpdateField(globalFieldIndex, 'fileConfig', fileConfig);
                                  }}
                                  id={`file-multiple-${field.fieldId}`}
                                />
                                <label htmlFor={`file-multiple-${field.fieldId}`} className="ml-2 block text-xs text-gray-700">
                                  Allow multiple files
                                </label>
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Allowed File Types (comma separated)</label>
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-orange-500"
                                  value={(field.fileConfig && field.fileConfig.allowedTypes) ? field.fileConfig.allowedTypes.join(', ') : ''}
                                  onChange={(e) => {
                                    const types = e.target.value.split(',').map(type => type.trim()).filter(Boolean);
                                    const fileConfig = { ...(field.fileConfig || {}), allowedTypes: types };
                                    handleUpdateField(globalFieldIndex, 'fileConfig', fileConfig);
                                  }}
                                  placeholder="application/pdf, image/jpeg, image/png"
                                />
                                <p className="text-xs text-gray-500 mt-1">Example: application/pdf, image/jpeg, image/png</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>  
                    );
                  })}
                  
                  <button
                    type="button"
                    className="mt-2 py-1 px-3 border border-orange-300 text-orange-600 hover:bg-orange-50 rounded text-sm"
                    onClick={() => handleAddField(section.sectionId)}
                  >
                    + Add a field to this section
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Form Preview placeholder */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-orange-600">Form Preview</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-600 text-center">
                Form preview feature coming soon. You can view your form by navigating to the event page.
              </p>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t">
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded"
              onClick={() => navigate(`/events/${eventId}`)}
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                className="bg-white hover:bg-gray-100 text-orange-600 border border-orange-500 font-semibold py-2 px-4 rounded"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset all changes?')) {
                    // Reload the page to reset the form
                    window.location.reload();
                  }
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Form'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default CustomFormCreatorPage;
