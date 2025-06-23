// realTimeApi.ts - Real-time API service for MongoDB integration

import { User, Job, Interview, ChatMessage } from '../types';

// API Configuration
const API_BASE_URL = 'http://localhost:5000';

class APIClient {
  private token: string | null = null;

  constructor() {
    // Try to get token from localStorage
    this.token = localStorage.getItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  private setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  private clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  // Authentication methods
  async login(email: string, password: string, role: 'candidate' | 'admin') {
    try {
      const response = await this.request<{
        success: boolean;
        user: User;
        access_token: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (response.success && response.access_token) {
        this.setToken(response.access_token);
        return { success: true, user: response.user, token: response.access_token };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async signup(userData: Partial<User>, password: string) {
    try {
      const response = await this.request<{
        success: boolean;
        user: User;
        access_token: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...userData, password }),
      });

      if (response.success && response.access_token) {
        this.setToken(response.access_token);
        return { success: true, user: response.user, token: response.access_token };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  }

  async updateProfile(userData: Partial<User>) {
    try {
      const response = await this.request<{
        success: boolean;
        user: User;
      }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Profile update failed' };
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.request<{
        success: boolean;
        user: User;
      }>('/auth/profile', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get current user' };
    }
  }

  logout() {
    this.clearToken();
  }

  // Job methods
  async getJobs() {
    try {
      const response = await this.request<{
        success: boolean;
        jobs: Job[];
      }>('/jobs');

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch jobs' };
    }
  }

  async getJobById(id: string) {
    try {
      const response = await this.request<{
        success: boolean;
        job: Job;
      }>(`/jobs/${id}`);

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch job' };
    }
  }

  async createJob(jobData: Omit<Job, 'id' | 'createdAt'>) {
    try {
      const response = await this.request<{
        success: boolean;
        job: Job;
      }>('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create job' };
    }
  }

  async updateJob(id: string, jobData: Partial<Job>) {
    try {
      const response = await this.request<{
        success: boolean;
        job: Job;
      }>(`/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(jobData),
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update job' };
    }
  }

  async deleteJob(id: string) {
    try {
      const response = await this.request<{
        success: boolean;
      }>(`/jobs/${id}`, {
        method: 'DELETE',
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete job' };
    }
  }

  // Interview methods
  async getInterviews(candidateId?: string) {
    try {
      const response = await this.request<{
        success: boolean;
        interviews: Interview[];
      }>('/interviews');

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch interviews' };
    }
  }

  async scheduleInterview(candidateId: string, jobId: string, scheduledAt: Date) {
    try {
      const response = await this.request<{
        success: boolean;
        interview: Interview;
      }>('/interviews', {
        method: 'POST',
        body: JSON.stringify({
          job_id: jobId,
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule interview' };
    }
  }

  async getInterviewById(id: string) {
    try {
      const response = await this.request<{
        success: boolean;
        interview: Interview;
      }>(`/interviews/${id}`);

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch interview' };
    }
  }

  async addChatMessage(interviewId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    try {
      const response = await this.request<{
        success: boolean;
        message: ChatMessage;
      }>(`/interviews/${interviewId}/messages`, {
        method: 'POST',
        body: JSON.stringify(message),
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add message' };
    }
  }

  async completeInterview(interviewId: string, aiSummary: string, performanceScore: number, feedback: string) {
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
      }>(`/interviews/${interviewId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          ai_summary: aiSummary,
          performance_score: performanceScore,
          feedback: feedback,
        }),
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to complete interview' };
    }
  }

  // Generate AI response for chat
  async generateAIResponse(userMessage: string, context: ChatMessage[]) {
    // This is a simple mock implementation
    // In a real application, you would send this to your AI service
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = [
      "That's an interesting point. Can you elaborate on your experience with that technology?",
      "Great! Can you walk me through your problem-solving approach for that scenario?",
      "I see. How do you handle challenges when working in a team environment?",
      "Excellent answer! Now, let me ask you about your experience with...",
      "Can you provide a specific example of when you implemented that solution?",
      "That's a good approach. What would you do if you encountered performance issues?",
      "Interesting! How do you stay updated with the latest industry trends?",
      "Perfect! Let's discuss your experience with project management and deadlines.",
      "Thank you for that detailed explanation. How do you handle code reviews?",
      "Great insight! What's your approach to testing and quality assurance?"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      message: randomResponse
    };
  }

  // Activity methods
  async getActivities() {
    try {
      const response = await this.request<{
        success: boolean;
        activities: any[];
      }>('/activities');

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch activities' };
    }
  }

  // Resume upload
  async uploadResume(file: File) {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${API_BASE_URL}/uploadcv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async submitAnswers(answers: any[]) {
    try {
      const response = await this.request<{
        success: boolean;
        results: any[];
      }>('/submitqna', {
        method: 'POST',
        body: JSON.stringify(answers),
      });

      return response;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to submit answers' };
    }
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export services that match the existing mockApi interface
export const mockAuthService = {
  async login(email: string, password: string, role: 'candidate' | 'admin') {
    return apiClient.login(email, password, role);
  },

  async signup(userData: Partial<User>, password: string) {
    return apiClient.signup(userData, password);
  },

  async updateProfile(userData: Partial<User>) {
    return apiClient.updateProfile(userData);
  },

  async getCurrentUser() {
    return apiClient.getCurrentUser();
  },

  logout() {
    apiClient.logout();
  }
};

export const mockJobService = {
  async getJobs() {
    return apiClient.getJobs();
  },

  async getJobById(id: string) {
    return apiClient.getJobById(id);
  },

  async createJob(jobData: Omit<Job, 'id' | 'createdAt'>) {
    return apiClient.createJob(jobData);
  },

  async updateJob(id: string, jobData: Partial<Job>) {
    return apiClient.updateJob(id, jobData);
  },

  async deleteJob(id: string) {
    return apiClient.deleteJob(id);
  }
};

export const mockInterviewService = {
  async getInterviews(candidateId?: string) {
    return apiClient.getInterviews(candidateId);
  },

  async scheduleInterview(candidateId: string, jobId: string, scheduledAt: Date) {
    return apiClient.scheduleInterview(candidateId, jobId, scheduledAt);
  },

  async getInterviewById(id: string) {
    return apiClient.getInterviewById(id);
  },

  async addChatMessage(interviewId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    return apiClient.addChatMessage(interviewId, message);
  },

  async completeInterview(interviewId: string, aiSummary: string, performanceScore: number, feedback: string) {
    return apiClient.completeInterview(interviewId, aiSummary, performanceScore, feedback);
  },

  async generateAIResponse(userMessage: string, context: ChatMessage[]) {
    return apiClient.generateAIResponse(userMessage, context);
  }
};

export const mockAdminService = {
  async getCandidates() {
    // This would need a specific endpoint in the backend
    return { success: true, candidates: [] };
  },

  async getInterviewAnalytics() {
    const activities = await apiClient.getActivities();
    return {
      success: true,
      analytics: {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        highPerformers: 0,
        recentInterviews: [],
      }
    };
  }
};

export default apiClient;
