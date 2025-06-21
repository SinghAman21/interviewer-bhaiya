import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MessageSquare, Users } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'candidate' as 'candidate' | 'admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password, formData.role);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to Bolt.new
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your AI-powered interview platform
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'candidate' })}
                className={`flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  formData.role === 'candidate'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={`flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  formData.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Admin
              </button>
            </div>

            <Input
              label="Email address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Sign in
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Candidate:</strong> john@example.com / password123</p>
              <p><strong>Admin:</strong> admin@bolt.new / password123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};