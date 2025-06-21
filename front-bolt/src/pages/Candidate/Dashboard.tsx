import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockJobService, mockInterviewService } from '../../services/mockApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { 
  Calendar, 
  Briefcase, 
  Clock, 
  Star, 
  TrendingUp,
  MessageSquare,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Job, Interview } from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsResponse, interviewsResponse] = await Promise.all([
          mockJobService.getJobs(),
          mockInterviewService.getInterviews(user?.id),
        ]);

        if (jobsResponse.success) {
          setJobs(jobsResponse.jobs.slice(0, 3)); // Show only recent jobs
        }

        if (interviewsResponse.success) {
          setInterviews(interviewsResponse.interviews);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled' && new Date(i.scheduledAt) > new Date());
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const averageScore = completedInterviews.length > 0 
    ? completedInterviews.reduce((sum, i) => sum + (i.performanceScore || 0), 0) / completedInterviews.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Ready to take your next interview challenge?
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{upcomingInterviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedInterviews.length}</p>
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
                {averageScore > 0 ? averageScore.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {completedInterviews.length > 2 ? 'Excellent' : 'Good'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
              <Link
                to="/interviews"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {upcomingInterviews.length > 0 ? (
              <div className="space-y-3">
                {upcomingInterviews.slice(0, 3).map((interview) => {
                  const job = jobs.find(j => j.id === interview.jobId);
                  return (
                    <div key={interview.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{job?.title}</h3>
                          <p className="text-sm text-gray-600">{job?.company}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(interview.scheduledAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming interviews</h3>
                <p className="mt-1 text-sm text-gray-500">Schedule your first interview to get started.</p>
                <Link
                  to="/jobs"
                  className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Latest Job Opportunities</h2>
              <Link
                to="/jobs"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.techStack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tech}
                          </span>
                        ))}
                        {job.techStack.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{job.techStack.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ready for your next interview?</h2>
            <p className="mt-1 opacity-90">
              Practice with AI and land your dream job
            </p>
          </div>
          <Link
            to="/jobs"
            className="bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};