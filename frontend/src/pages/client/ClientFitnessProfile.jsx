import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Client Fitness Profile Page
 * Comprehensive fitness profile management for clients
 */
const ClientFitnessProfile = () => {
  const navigate = useNavigate();
  const { tokens, user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Basic Info
    bio: '',
    date_of_birth: '',
    gender: '',

    // Physical Stats
    height_inches: '',
    current_weight_lbs: '',
    target_weight_lbs: '',

    // Fitness Profile
    fitness_level: 'beginner',
    primary_goal: '',
    secondary_goals: [],

    // Health Information
    health_conditions: '',
    medications: '',
    dietary_restrictions: '',

    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',

    // Workout Preferences
    preferred_workout_days: [],
    preferred_workout_times: [],
    sessions_per_week: '',
    preferred_session_duration: '',
    preferred_training_style: '',
  });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/v1/users/profiles/client/', {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);

      // Populate form with existing data
      setFormData({
        bio: data.bio || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        height_inches: data.height_inches || '',
        current_weight_lbs: data.current_weight_lbs || '',
        target_weight_lbs: data.target_weight_lbs || '',
        fitness_level: data.fitness_level || 'beginner',
        primary_goal: data.primary_goal || '',
        secondary_goals: data.secondary_goals || [],
        health_conditions: data.health_conditions || '',
        medications: data.medications || '',
        dietary_restrictions: data.dietary_restrictions || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        emergency_contact_relationship: data.emergency_contact_relationship || '',
        preferred_workout_days: data.preferred_workout_days || [],
        preferred_workout_times: data.preferred_workout_times || [],
        sessions_per_week: data.sessions_per_week || '',
        preferred_session_duration: data.preferred_session_duration || '',
        preferred_training_style: data.preferred_training_style || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      let body;
      let headers = {
        Authorization: `Bearer ${tokens.access}`,
      };

      // If file is selected, use FormData, otherwise use JSON
      if (selectedFile) {
        const formDataToSend = new FormData();

        // Add file
        formDataToSend.append('profile_photo', selectedFile);

        // Add all other form fields
        Object.keys(formData).forEach((key) => {
          const value = formData[key];
          // Handle arrays (JSONField in Django)
          if (Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (value !== null && value !== '') {
            formDataToSend.append(key, value);
          }
        });

        formDataToSend.append('profile_complete', 'true');
        body = formDataToSend;
        // Don't set Content-Type header for FormData - browser will set it with boundary
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          ...formData,
          profile_complete: true,
        });
      }

      const response = await fetch('http://localhost:8000/api/v1/users/profiles/client/', {
        method: 'PATCH',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setSuccessMessage('Profile updated successfully!');

      // Clear file selection after successful upload
      setSelectedFile(null);
      setPreviewUrl(null);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [name]: newValues,
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'fitness', label: 'Fitness Goals', icon: '🎯' },
    { id: 'health', label: 'Health Info', icon: '❤️' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'emergency', label: 'Emergency Contact', icon: '🚨' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Fitness Profile</h1>
              <p className="text-gray-600 mt-1">
                Share your fitness goals and preferences with trainers
              </p>
            </div>
            {profile && profile.bmi && (
              <div className="text-right">
                <p className="text-sm text-gray-600">BMI</p>
                <p className="text-2xl font-bold text-gray-900">{profile.bmi}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Basic Information</h2>

                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center space-x-6">
                    {/* Current or Preview Photo */}
                    <div className="flex-shrink-0">
                      {previewUrl || profile?.profile_photo ? (
                        <img
                          src={previewUrl || `http://localhost:8000${profile.profile_photo}`}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                          <span className="text-5xl text-gray-400">👤</span>
                        </div>
                      )}
                    </div>

                    {/* File Input */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="profile_photo"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="profile_photo"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {selectedFile ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      {selectedFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    About You
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell trainers about yourself, your fitness journey, and what you're looking for..."
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">{formData.bio.length}/500</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {profile?.age && (
                      <p className="mt-1 text-sm text-gray-600">Age: {profile.age} years</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Height */}
                  <div>
                    <label htmlFor="height_inches" className="block text-sm font-medium text-gray-700 mb-2">
                      Height (inches)
                    </label>
                    <input
                      type="number"
                      id="height_inches"
                      name="height_inches"
                      value={formData.height_inches}
                      onChange={handleInputChange}
                      min="20"
                      max="118"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="67"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter your height in inches (e.g., 5'7" = 67 inches)</p>
                  </div>

                  {/* Current Weight */}
                  <div>
                    <label htmlFor="current_weight_lbs" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Weight (lbs)
                    </label>
                    <input
                      type="number"
                      id="current_weight_lbs"
                      name="current_weight_lbs"
                      value={formData.current_weight_lbs}
                      onChange={handleInputChange}
                      min="44"
                      max="1100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="155.5"
                    />
                  </div>

                  {/* Target Weight */}
                  <div>
                    <label htmlFor="target_weight_lbs" className="block text-sm font-medium text-gray-700 mb-2">
                      Target Weight (lbs)
                    </label>
                    <input
                      type="number"
                      id="target_weight_lbs"
                      name="target_weight_lbs"
                      value={formData.target_weight_lbs}
                      onChange={handleInputChange}
                      min="44"
                      max="1100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="143.0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Fitness Goals Tab */}
            {activeTab === 'fitness' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Fitness Goals</h2>

                {/* Fitness Level */}
                <div>
                  <label htmlFor="fitness_level" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Fitness Level
                  </label>
                  <select
                    id="fitness_level"
                    name="fitness_level"
                    value={formData.fitness_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="beginner">Beginner - Just starting out</option>
                    <option value="intermediate">Intermediate - Regular exercise</option>
                    <option value="advanced">Advanced - Consistent training</option>
                    <option value="athlete">Athlete - Competitive level</option>
                  </select>
                </div>

                {/* Primary Goal */}
                <div>
                  <label htmlFor="primary_goal" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Fitness Goal *
                  </label>
                  <select
                    id="primary_goal"
                    name="primary_goal"
                    value={formData.primary_goal}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select your primary goal</option>
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="endurance">Build Endurance</option>
                    <option value="strength">Build Strength</option>
                    <option value="flexibility">Improve Flexibility</option>
                    <option value="general_fitness">General Fitness</option>
                    <option value="sports_performance">Sports Performance</option>
                    <option value="rehabilitation">Rehabilitation</option>
                    <option value="stress_relief">Stress Relief</option>
                  </select>
                </div>

                {/* Secondary Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Goals (select all that apply)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { value: 'weight_loss', label: 'Weight Loss' },
                      { value: 'muscle_gain', label: 'Muscle Gain' },
                      { value: 'endurance', label: 'Build Endurance' },
                      { value: 'strength', label: 'Build Strength' },
                      { value: 'flexibility', label: 'Improve Flexibility' },
                      { value: 'general_fitness', label: 'General Fitness' },
                      { value: 'sports_performance', label: 'Sports Performance' },
                      { value: 'rehabilitation', label: 'Rehabilitation' },
                      { value: 'stress_relief', label: 'Stress Relief' },
                    ].map((goal) => (
                      <label key={goal.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.secondary_goals.includes(goal.value)}
                          onChange={() => handleCheckboxChange('secondary_goals', goal.value)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{goal.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Training Style */}
                <div>
                  <label htmlFor="preferred_training_style" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Training Style
                  </label>
                  <input
                    type="text"
                    id="preferred_training_style"
                    name="preferred_training_style"
                    value={formData.preferred_training_style}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., High intensity, Low impact, Bodyweight only"
                  />
                </div>
              </div>
            )}

            {/* Health Info Tab */}
            {activeTab === 'health' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Health Information</h2>
                <p className="text-sm text-gray-600 mb-4">
                  This information helps trainers create safe and effective workouts for you.
                </p>

                {/* Health Conditions */}
                <div>
                  <label htmlFor="health_conditions" className="block text-sm font-medium text-gray-700 mb-2">
                    Health Conditions or Injuries
                  </label>
                  <textarea
                    id="health_conditions"
                    name="health_conditions"
                    value={formData.health_conditions}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="List any health conditions, past injuries, or physical limitations trainers should know about..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    e.g., Bad knee, Lower back pain, Asthma, etc.
                  </p>
                </div>

                {/* Medications */}
                <div>
                  <label htmlFor="medications" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Medications (Optional)
                  </label>
                  <textarea
                    id="medications"
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="List any medications that might affect your workouts..."
                  />
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <label htmlFor="dietary_restrictions" className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Restrictions or Preferences
                  </label>
                  <textarea
                    id="dietary_restrictions"
                    name="dietary_restrictions"
                    value={formData.dietary_restrictions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Vegetarian, Vegan, Gluten-free, No dairy..."
                  />
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Workout Preferences</h2>

                {/* Preferred Workout Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Workout Days
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'monday', label: 'Monday' },
                      { value: 'tuesday', label: 'Tuesday' },
                      { value: 'wednesday', label: 'Wednesday' },
                      { value: 'thursday', label: 'Thursday' },
                      { value: 'friday', label: 'Friday' },
                      { value: 'saturday', label: 'Saturday' },
                      { value: 'sunday', label: 'Sunday' },
                    ].map((day) => (
                      <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preferred_workout_days.includes(day.value)}
                          onChange={() => handleCheckboxChange('preferred_workout_days', day.value)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Workout Times */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Workout Times
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'early_morning', label: 'Early Morning (5-7 AM)' },
                      { value: 'morning', label: 'Morning (7-10 AM)' },
                      { value: 'midday', label: 'Midday (10 AM-2 PM)' },
                      { value: 'afternoon', label: 'Afternoon (2-6 PM)' },
                      { value: 'evening', label: 'Evening (6-9 PM)' },
                      { value: 'night', label: 'Night (9 PM+)' },
                    ].map((time) => (
                      <label key={time.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preferred_workout_times.includes(time.value)}
                          onChange={() => handleCheckboxChange('preferred_workout_times', time.value)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{time.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sessions Per Week */}
                  <div>
                    <label htmlFor="sessions_per_week" className="block text-sm font-medium text-gray-700 mb-2">
                      Desired Sessions Per Week
                    </label>
                    <select
                      id="sessions_per_week"
                      name="sessions_per_week"
                      value={formData.sessions_per_week}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select frequency</option>
                      <option value="1">1 session/week</option>
                      <option value="2">2 sessions/week</option>
                      <option value="3">3 sessions/week</option>
                      <option value="4">4 sessions/week</option>
                      <option value="5">5 sessions/week</option>
                      <option value="6">6 sessions/week</option>
                      <option value="7">7 sessions/week</option>
                    </select>
                  </div>

                  {/* Preferred Session Duration */}
                  <div>
                    <label htmlFor="preferred_session_duration" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Session Duration (minutes)
                    </label>
                    <select
                      id="preferred_session_duration"
                      name="preferred_session_duration"
                      value={formData.preferred_session_duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select duration</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                      <option value="120">120 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact Tab */}
            {activeTab === 'emergency' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Emergency Contact</h2>
                <p className="text-sm text-gray-600 mb-4">
                  This information is kept confidential and only used in case of an emergency during training sessions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emergency Contact Name */}
                  <div>
                    <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Full name"
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div>
                    <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Emergency Contact Relationship */}
                  <div className="md:col-span-2">
                    <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_relationship"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Spouse, Parent, Sibling, Friend"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Save Button */}
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/client/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientFitnessProfile;
