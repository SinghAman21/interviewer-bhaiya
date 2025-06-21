import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockInterviewService, mockJobService } from '../../services/mockApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Star, Download, Share, ArrowLeft, MessageSquare, Clock, CheckCircle, TrendingUp, User, Notebook as Robot } from 'lucide-react';
import { Interview, Job } from '../../types';

export const InterviewResults: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!interviewId) return;

      try {
        const interviewResponse = await mockInterviewService.getInterviewById(interviewId);
        if (interviewResponse.success && interviewResponse.interview) {
          setInterview(interviewResponse.interview);
          
          const jobResponse = await mockJobService.getJobById(interviewResponse.interview.jobId);
          if (jobResponse.success && jobResponse.job) {
            setJob(jobResponse.job);
          }
        }
      } catch (error) {
        console.error('Error fetching interview results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [interviewId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading results..." />
      </div>
    );
  }

  if (!interview || !job) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Results not found</h2>
          <Button onClick={() => navigate('/interviews')} className="mt-4">
            Back to Interviews
          </Button>
        </div>
      </div>
    );
  }

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${star <= score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-900">({score}/5)</span>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/interviews')}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Interviews
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>

      {/* Results Overview */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Results</h1>
              <p className="text-gray-600 mt-1">{job.title} at {job.company}</p>
              <p className="text-sm text-gray-500 mt-1">
                Completed on {new Date(interview.scheduledAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600">Completed</span>
            </div>
          </div>
        </div>

        {/* Performance Score */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-2">
                {interview.performanceScore && renderStars(interview.performanceScore)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Performance</h3>
              <p className={`text-sm font-medium ${getScoreColor(interview.performanceScore || 0)}`}>
                {getScoreLabel(interview.performanceScore || 0)}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Duration</h3>
              <p className="text-sm text-gray-600">
                {Math.floor(interview.transcript.length * 2)} minutes
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Responses</h3>
              <p className="text-sm text-gray-600">
                {interview.transcript.filter(m => m.sender === 'candidate').length} answers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">AI Feedback</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3">Summary</h3>
              <p className="text-gray-700 leading-relaxed">{interview.aiSummary}</p>
            </div>
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3">Detailed Feedback</h3>
              <p className="text-gray-700 leading-relaxed">{interview.feedback}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Transcript */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Interview Transcript</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {interview.transcript.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-3xl ${message.sender === 'candidate' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'candidate' 
                    ? 'bg-blue-500' 
                    : 'bg-purple-500'
                  }`}>
                    {message.sender === 'candidate' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Robot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className={`rounded-lg px-4 py-3 ${message.sender === 'candidate'
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className="text-xs mt-1 text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">What's Next?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Continue Improving</h3>
            <p className="text-blue-100 text-sm mb-3">
              Practice more interviews to improve your skills and confidence.
            </p>
            <Link to="/jobs">
              <Button variant="secondary" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Schedule Another Interview
              </Button>
            </Link>
          </div>
          <div>
            <h3 className="font-medium mb-2">Share Your Success</h3>
            <p className="text-blue-100 text-sm mb-3">
              Share your interview performance with potential employers.
            </p>
            <Button variant="secondary" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};