import React, { useState, useEffect } from 'react';
import { mockJobService } from '../../services/mockApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Briefcase, 
  MapPin, 
  Clock,
  DollarSign,
  Search
} from 'lucide-react';
import { Job } from '../../types';

export const ManageJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    techStack: '',
    requirements: '',
    location: '',
    type: 'full-time' as 'full-time' | 'part-time' | 'contract',
    salaryRange: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await mockJobService.getJobs();
      if (response.success) {
        setJobs(response.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      techStack: '',
      requirements: '',
      location: '',
      type: 'full-time',
      salaryRange: '',
    });
    setEditingJob(null);
    setMessage('');
  };

  const openModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        company: job.company,
        description: job.description,
        techStack: job.techStack.join(', '),
        requirements: job.requirements.join(', '),
        location: job.location,
        type: job.type,
        salaryRange: job.salaryRange || '',
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const jobData = {
        ...formData,
        techStack: formData.techStack.split(',').map(s => s.trim()).filter(s => s.length > 0),
        requirements: formData.requirements.split(',').map(s => s.trim()).filter(s => s.length > 0),
        createdBy: 'admin1', // In a real app, this would be the current admin's ID
      };

      let response;
      if (editingJob) {
        response = await mockJobService.updateJob(editingJob.id, jobData);
      } else {
        response = await mockJobService.createJob(jobData);
      }

      if (response.success) {
        setMessage(`Job ${editingJob ? 'updated' : 'created'} successfully!`);
        await fetchJobs();
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setMessage(`Failed to ${editingJob ? 'update' : 'create'} job. Please try again.`);
      }
    } catch (error) {
      setMessage(`Failed to ${editingJob ? 'update' : 'create'} job. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await mockJobService.deleteJob(jobId);
      if (response.success) {
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
            <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="text-gray-600 mt-1">Create and manage job listings</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="grid gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(job)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Job Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingJob ? 'Edit Job' : 'Create New Job'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g. Senior Frontend Developer"
            />

            <Input
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              required
              placeholder="e.g. TechCorp Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Describe the role and responsibilities..."
            />
          </div>

          <Input
            label="Tech Stack"
            name="techStack"
            value={formData.techStack}
            onChange={handleInputChange}
            required
            placeholder="React, Node.js, TypeScript (comma separated)"
            helperText="Separate technologies with commas"
          />

          <Input
            label="Requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            required
            placeholder="5+ years experience, Strong React skills (comma separated)"
            helperText="Separate requirements with commas"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="e.g. San Francisco, CA or Remote"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>

          <Input
            label="Salary Range (Optional)"
            name="salaryRange"
            value={formData.salaryRange}
            onChange={handleInputChange}
            placeholder="e.g. $120k - $150k"
          />

          {message && (
            <div className={`p-3 rounded-md ${message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-600' 
              : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {editingJob ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};