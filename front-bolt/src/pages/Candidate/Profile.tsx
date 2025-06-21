import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Upload, ExternalLink, Save } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    linkedinUrl: user?.linkedinUrl || '',
    skills: (user?.skills || []).join(', '),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const success = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        linkedinUrl: formData.linkedinUrl,
        skills: skillsArray,
      });

      if (success) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile. Please try again.');
      }
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only.');
        return;
      }
      // In a real app, you would upload the file to a server
      console.log('Resume uploaded:', file.name);
      setMessage('Resume uploaded successfully!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                helperText="Email cannot be changed"
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1-234-567-8900"
              />

              <Input
                label="LinkedIn URL"
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="React, Node.js, TypeScript, etc. (comma separated)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separate skills with commas
                </p>
              </div>

              {message && (
                <div className={`p-3 rounded-md ${message.includes('successfully') 
                  ? 'bg-green-50 border border-green-200 text-green-600' 
                  : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resume Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload your resume
                  </span>
                  <input
                    id="resume-upload"
                    name="resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="sr-only"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  PDF files only, up to 10MB
                </p>
              </div>
            </div>

            {user?.resume && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">Current Resume</span>
                  <button className="text-blue-600 hover:text-blue-700">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profile Completion</span>
                <span className="text-sm font-medium text-gray-900">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member since</span>
                  <span className="text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Account type</span>
                  <span className="text-gray-900 capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};