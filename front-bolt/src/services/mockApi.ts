import { User, Job, Interview, ChatMessage } from '../types';

// Mock data storage
let users: User[] = [
  {
    id: 'admin1',
    email: 'admin@bolt.new',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'candidate1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'candidate',
    phone: '+1-234-567-8900',
    skills: ['JavaScript', 'React', 'Node.js'],
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    createdAt: new Date('2024-01-15'),
  },
];

let jobs: Job[] = [
  {
    id: 'job1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    description: 'We are looking for a senior frontend developer to join our team and work on cutting-edge web applications.',
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    requirements: ['5+ years experience', 'Strong React skills', 'Experience with TypeScript'],
    location: 'San Francisco, CA',
    type: 'full-time',
    salaryRange: '$120k - $150k',
    createdAt: new Date('2024-01-10'),
    createdBy: 'admin1',
  },
  {
    id: 'job2',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    description: 'Join our fast-growing startup as a full stack developer and help build the next generation of SaaS products.',
    techStack: ['Node.js', 'React', 'MongoDB', 'AWS'],
    requirements: ['3+ years full stack experience', 'Experience with cloud platforms', 'Startup mindset'],
    location: 'Remote',
    type: 'full-time',
    salaryRange: '$90k - $120k',
    createdAt: new Date('2024-01-12'),
    createdBy: 'admin1',
  },
];

let interviews: Interview[] = [
  {
    id: 'interview1',
    candidateId: 'candidate1',
    jobId: 'job1',
    scheduledAt: new Date('2025-01-20T10:00:00'),
    status: 'completed',
    transcript: [
      {
        id: 'msg1',
        sender: 'ai',
        message: 'Hello John! Welcome to your technical interview for the Senior Frontend Developer position at TechCorp Inc. I\'m your AI interviewer today. Are you ready to begin?',
        timestamp: new Date('2024-01-20T10:00:00'),
      },
      {
        id: 'msg2',
        sender: 'candidate',
        message: 'Yes, I\'m ready! Thank you for having me.',
        timestamp: new Date('2024-01-20T10:00:30'),
      },
      {
        id: 'msg3',
        sender: 'ai',
        message: 'Great! Let\'s start with your experience. Can you tell me about a challenging React project you\'ve worked on recently?',
        timestamp: new Date('2024-01-20T10:01:00'),
      },
      {
        id: 'msg4',
        sender: 'candidate',
        message: 'I recently worked on a complex dashboard application with real-time data visualization. The main challenge was optimizing performance with large datasets while maintaining smooth user interactions.',
        timestamp: new Date('2024-01-20T10:01:45'),
      },
    ],
    aiSummary: 'John demonstrated strong technical knowledge and problem-solving skills. He showed excellent understanding of React performance optimization and real-time data handling.',
    performanceScore: 4,
    feedback: 'Excellent technical skills and communication. Would be a great fit for the senior role.',
    createdAt: new Date('2024-01-15'),
  },
];

// Simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
  async login(email: string, password: string, role: 'candidate' | 'admin') {
    await delay(1000);
    
    // Mock authentication - in production, this would verify against a secure backend
    const user = users.find(u => u.email === email && u.role === role);
    
    if (user && password === 'password123') {
      return {
        success: true,
        user,
        token: `mock-jwt-token-${user.id}`,
      };
    }
    
    return { success: false, error: 'Invalid credentials' };
  },

  async signup(userData: Partial<User>, password: string) {
    await delay(1000);
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }
    
    const newUser: User = {
      id: `user${Date.now()}`,
      email: userData.email!,
      name: userData.name!,
      role: userData.role || 'candidate',
      phone: userData.phone,
      skills: userData.skills || [],
      linkedinUrl: userData.linkedinUrl,
      createdAt: new Date(),
    };
    
    users.push(newUser);
    
    return {
      success: true,
      user: newUser,
      token: `mock-jwt-token-${newUser.id}`,
    };
  },
};

export const mockJobService = {
  async getJobs() {
    await delay(500);
    return { success: true, jobs };
  },

  async getJobById(id: string) {
    await delay(300);
    const job = jobs.find(j => j.id === id);
    return { success: !!job, job };
  },

  async createJob(jobData: Omit<Job, 'id' | 'createdAt'>) {
    await delay(800);
    const newJob: Job = {
      ...jobData,
      id: `job${Date.now()}`,
      createdAt: new Date(),
    };
    jobs.push(newJob);
    return { success: true, job: newJob };
  },

  async updateJob(id: string, jobData: Partial<Job>) {
    await delay(800);
    const jobIndex = jobs.findIndex(j => j.id === id);
    if (jobIndex === -1) {
      return { success: false, error: 'Job not found' };
    }
    
    jobs[jobIndex] = { ...jobs[jobIndex], ...jobData };
    return { success: true, job: jobs[jobIndex] };
  },

  async deleteJob(id: string) {
    await delay(500);
    const jobIndex = jobs.findIndex(j => j.id === id);
    if (jobIndex === -1) {
      return { success: false, error: 'Job not found' };
    }
    
    jobs.splice(jobIndex, 1);
    return { success: true };
  },
};

export const mockInterviewService = {
  async getInterviews(candidateId?: string) {
    await delay(500);
    const filteredInterviews = candidateId 
      ? interviews.filter(i => i.candidateId === candidateId)
      : interviews;
    return { success: true, interviews: filteredInterviews };
  },

  async scheduleInterview(candidateId: string, jobId: string, scheduledAt: Date) {
    await delay(800);
    const newInterview: Interview = {
      id: `interview${Date.now()}`,
      candidateId,
      jobId,
      scheduledAt,
      status: 'scheduled',
      transcript: [],
      createdAt: new Date(),
    };
    interviews.push(newInterview);
    return { success: true, interview: newInterview };
  },

  async getInterviewById(id: string) {
    await delay(300);
    const interview = interviews.find(i => i.id === id);
    return { success: !!interview, interview };
  },

  async addChatMessage(interviewId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    await delay(200);
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }
    
    const newMessage: ChatMessage = {
      ...message,
      id: `msg${Date.now()}`,
      timestamp: new Date(),
    };
    
    interview.transcript.push(newMessage);
    return { success: true, message: newMessage };
  },

  async completeInterview(interviewId: string, aiSummary: string, performanceScore: number, feedback: string) {
    await delay(1000);
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }
    
    interview.status = 'completed';
    interview.aiSummary = aiSummary;
    interview.performanceScore = performanceScore;
    interview.feedback = feedback;
    
    return { success: true, interview };
  },

  // Mock AI response generation
  async generateAIResponse(userMessage: string, context: ChatMessage[]) {
    await delay(1500); // Simulate thinking time
    
    const responses = [
      "That's a great point! Can you tell me more about how you approached that challenge?",
      "Interesting solution. How did you handle error cases or edge scenarios?",
      "I see you have experience with that technology. What do you think are its main advantages and limitations?",
      "That sounds like a complex project. How did you ensure code quality and maintainability?",
      "Good answer! Now, let's dive into a technical scenario. How would you optimize this React component for performance?",
      "Thank you for sharing that experience. What metrics did you use to measure the success of your implementation?",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      success: true,
      message: randomResponse,
    };
  },
};

export const mockAdminService = {
  async getCandidates() {
    await delay(500);
    const candidates = users.filter(u => u.role === 'candidate');
    return { success: true, candidates };
  },

  async getInterviewAnalytics() {
    await delay(700);
    
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    const totalInterviews = interviews.length;
    const averageScore = completedInterviews.reduce((sum, i) => sum + (i.performanceScore || 0), 0) / completedInterviews.length;
    
    return {
      success: true,
      analytics: {
        totalInterviews,
        completedInterviews: completedInterviews.length,
        averageScore: Math.round(averageScore * 10) / 10,
        highPerformers: completedInterviews.filter(i => (i.performanceScore || 0) >= 4).length,
        recentInterviews: interviews.slice(-10),
      },
    };
  },
};