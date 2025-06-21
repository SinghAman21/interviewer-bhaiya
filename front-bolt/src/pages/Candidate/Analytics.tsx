import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockInterviewService } from '../../services/mockApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { 
  TrendingUp, 
  Star, 
  Calendar, 
  Award,
  BarChart3,
  Target,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Interview } from '../../types';

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const response = await mockInterviewService.getInterviews(user?.id);
        if (response.success) {
          setInterviews(response.interviews);
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const averageScore = completedInterviews.length > 0 
    ? completedInterviews.reduce((sum, i) => sum + (i.performanceScore || 0), 0) / completedInterviews.length 
    : 0;

  const totalInterviews = interviews.length;
  const completionRate = totalInterviews > 0 ? (completedInterviews.length / totalInterviews) * 100 : 0;
  const totalResponseTime = completedInterviews.reduce((sum, i) => sum + i.transcript.length * 2, 0);
  const averageInterviewDuration = completedInterviews.length > 0 ? totalResponseTime / completedInterviews.length : 0;

  const recentTrend = completedInterviews.slice(-3);
  const trendDirection = recentTrend.length >= 2 
    ? recentTrend[recentTrend.length - 1].performanceScore! > recentTrend[0].performanceScore! 
      ? 'improving' : 'declining'
    : 'stable';

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600 mt-1">Track your interview progress and improvement</p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {averageScore > 0 ? averageScore.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Interviews</p>
              <p className="text-2xl font-semibold text-gray-900">{totalInterviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{completionRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className={`h-8 w-8 ${trendDirection === 'improving' ? 'text-green-600' : trendDirection === 'declining' ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Trend</p>
              <p className={`text-2xl font-semibold capitalize ${trendDirection === 'improving' ? 'text-green-600' : trendDirection === 'declining' ? 'text-red-600' : 'text-gray-900'}`}>
                {trendDirection}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Performance */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Performance</h2>
          </div>
          <div className="p-6">
            {completedInterviews.length > 0 ? (
              <div className="space-y-4">
                {completedInterviews.slice(-5).reverse().map((interview, index) => (
                  <div key={interview.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Interview #{completedInterviews.length - index}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(interview.scheduledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {renderStars(interview.performanceScore || 0)}
                      <p className="text-sm text-gray-600 mt-1">
                        {interview.performanceScore}/5
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No completed interviews</h3>
                <p className="mt-1 text-sm text-gray-500">Complete your first interview to see analytics.</p>
              </div>
            )}
          </div>
        </div>

        {/* Interview Stats */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Interview Statistics</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Avg. Duration</span>
                </div>
                <span className="text-sm text-gray-900">
                  {averageInterviewDuration > 0 ? `${Math.round(averageInterviewDuration)} min` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Total Responses</span>
                </div>
                <span className="text-sm text-gray-900">
                  {completedInterviews.reduce((sum, i) => sum + i.transcript.filter(m => m.sender === 'candidate').length, 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Best Score</span>
                </div>
                <span className="text-sm text-gray-900">
                  {completedInterviews.length > 0 
                    ? `${Math.max(...completedInterviews.map(i => i.performanceScore || 0))}/5`
                    : '—'
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Success Rate</span>
                </div>
                <span className="text-sm text-gray-900">
                  {completedInterviews.length > 0 
                    ? `${Math.round((completedInterviews.filter(i => (i.performanceScore || 0) >= 4).length / completedInterviews.length) * 100)}%`
                    : '—'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Improvement Suggestions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Practice More</h3>
            <p className="text-blue-100 text-sm">
              Regular practice helps improve your interview performance and confidence.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Review Feedback</h3>
            <p className="text-blue-100 text-sm">
              Analyze AI feedback from previous interviews to identify areas for improvement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};