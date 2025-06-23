import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';
import { Job } from '../../types';

export const Jobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [message, setMessage] = useState('');  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://localhost:5000/jobs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        const result = await response.json();
        if (result.success && result.jobs) {
          setJobs(result.jobs);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const handleScheduleInterview = async () => {
    if (!selectedJob || !scheduleData.date || !scheduleData.time) {
      setMessage('Please select both date and time');
      return;
    }

    setIsScheduling(true);
    setMessage('');

    try {
      const scheduledAt = new Date(`${scheduleData.date}T${scheduleData.time}`);
      
      const response = await fetch('http://localhost:5000/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          job_id: selectedJob.id,
          scheduled_at: scheduledAt.toISOString()
        })
      });

      const result = await response.json();

      if (result.success && result.interview) {
        setMessage('Interview scheduled successfully!');
        setIsScheduleModalOpen(false);
        setScheduleData({ date: '', time: '' });
        setSelectedJob(null);
      } else {
        setMessage('Failed to schedule interview: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setMessage('Failed to schedule interview. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading jobs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Opportunities</h1>
            <p className="text-gray-600 mt-1">Find your next career opportunity</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {filteredJobs.length} jobs available
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, companies, or technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="grid gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 font-medium">{job.company}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {job.type}
                      </span>
                      {job.salaryRange && (
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {job.salaryRange}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mt-3 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                <Button
                  onClick={() => {
                    setSelectedJob(job);
                    setIsScheduleModalOpen(true);
                  }}
                  className="w-full lg:w-auto"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedJob(null);
          setScheduleData({ date: '', time: '' });
          setMessage('');
        }}
        title="Schedule Interview"
        size="md"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{selectedJob.title}</h3>
              <p className="text-gray-600">{selectedJob.company}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Interview Date"
                type="date"
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />

              <Input
                label="Interview Time"
                type="time"
                value={scheduleData.time}
                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                required
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Interview Details:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Duration: Approximately 45-60 minutes</li>
                    <li>Format: AI-powered chat interview</li>
                    <li>Focus: Technical skills and problem-solving</li>
                    <li>You'll receive feedback and scoring after completion</li>
                  </ul>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md ${message.includes('successfully') 
                ? 'bg-green-50 border border-green-200 text-green-600' 
                : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {message}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setSelectedJob(null);
                  setScheduleData({ date: '', time: '' });
                  setMessage('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleInterview}
                isLoading={isScheduling}
                className="flex-1"
              >
                Schedule Interview
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};