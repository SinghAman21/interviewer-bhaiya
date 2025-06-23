import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockInterviewService, mockJobService } from '../../services/realTimeApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Star, 
  CheckCircle,
  Play,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Interview, Job } from '../../types';

export const Interviews: React.FC = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [interviewsResponse, jobsResponse] = await Promise.all([
          mockInterviewService.getInterviews(user?.id),
          mockJobService.getJobs(),
        ]);

        if (interviewsResponse.success && 'interviews' in interviewsResponse) {
          setInterviews(interviewsResponse.interviews);
        }

        if (jobsResponse.success && 'jobs' in jobsResponse) {
          setJobs(jobsResponse.jobs);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading interviews..." />
      </div>
    );
  }

  const getJobById = (jobId: string) => jobs.find(job => job.id === jobId);

  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled' && new Date(i.scheduledAt) > new Date());
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const inProgressInterviews = interviews.filter(i => i.status === 'in-progress');

  const getStatusIcon = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'in-progress':
        return <Play className="w-5 h-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (score?: number) => {
    if (!score) return null;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({score}/5)</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
            <p className="text-gray-600 mt-1">Track your interview progress and performance</p>
          </div>
          <Link to="/jobs">
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule New Interview
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
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
              <Play className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{inProgressInterviews.length}</p>
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
              <Star className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg. Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {completedInterviews.length > 0 
                  ? (completedInterviews.reduce((sum, i) => sum + (i.performanceScore || 0), 0) / completedInterviews.length).toFixed(1)
                  : '—'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingInterviews.map((interview) => {
              const job = getJobById(interview.jobId);
              const isToday = new Date(interview.scheduledAt).toDateString() === new Date().toDateString();
              const canStart = new Date(interview.scheduledAt) <= new Date(Date.now() + 15 * 60 * 1000); // 15 minutes before

              return (
                <>
                <div key={interview.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(interview.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{job?.title}</h3>
                        <p className="text-gray-600">{job?.company}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                          <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isToday && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {canStart && (
                        <Link to={`/interview/${interview.id}`}>
                          <Button>
                            <Play className="w-4 h-4 mr-2" />
                            Start Interview
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div key={interview.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(interview.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{job?.title}</h3>
                        <p className="text-gray-600">{job?.company}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                          <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isToday && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {canStart && (
                        <Link to={`/interview/${interview.id}`}>
                          <Button>
                            <Play className="w-4 h-4 mr-2" />
                            Start Interview
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                </>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Interviews */}
      {completedInterviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Completed Interviews</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {completedInterviews.map((interview) => {
              const job = getJobById(interview.jobId);

              return (
                <div key={interview.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(interview.status)}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{job?.title}</h3>
                        <p className="text-gray-600">{job?.company}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                        {interview.performanceScore && (
                          <div className="mt-2">
                            {renderStars(interview.performanceScore)}
                          </div>
                        )}
                        {interview.feedback && (
                          <p className="mt-2 text-sm text-gray-700 line-clamp-2">{interview.feedback}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/interview/${interview.id}/results`}>
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {interviews.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by scheduling your first interview.</p>
          <div className="mt-6">
            <Link to="/jobs">
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};