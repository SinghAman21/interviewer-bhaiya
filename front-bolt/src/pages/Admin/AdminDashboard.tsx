import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockAdminService, mockJobService } from '../../services/mockApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  TrendingUp,
  Star,
  Calendar,
  ArrowRight,
  Award
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsResponse, jobsResponse] = await Promise.all([
          mockAdminService.getInterviewAnalytics(),
          mockJobService.getJobs(),
        ]);

        if (analyticsResponse.success) {
          setAnalytics(analyticsResponse.analytics);
        }

        if (jobsResponse.success) {
          setJobs(jobsResponse.jobs);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage interviews, jobs, and candidate performance</p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Interviews</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.totalInterviews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.completedInterviews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg. Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.averageScore ? analytics.averageScore.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">High Performers</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.highPerformers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Interviews */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Interviews</h2>
              <Link
                to="/admin/interviews"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics?.recentInterviews?.slice(0, 5).map((interview: any) => (
              <div key={interview.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Interview #{interview.id.slice(-4)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(interview.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      interview.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : interview.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {interview.status}
                    </span>
                    {interview.performanceScore && (
                      <p className="text-sm text-gray-600 mt-1">
                        Score: {interview.performanceScore}/5
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent interviews</h3>
              </div>
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Job Listings</h2>
              <Link
                to="/admin/jobs"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                Manage jobs
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.techStack.slice(0, 3).map((tech: string) => (
                        <span
                          key={tech}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{jobs.length}</div>
            <div className="text-blue-100 text-sm">Active Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.completedInterviews || 0}</div>
            <div className="text-blue-100 text-sm">Interviews Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.highPerformers || 0}</div>
            <div className="text-blue-100 text-sm">Top Candidates</div>
          </div>
        </div>
      </div>
    </div>
  );
};