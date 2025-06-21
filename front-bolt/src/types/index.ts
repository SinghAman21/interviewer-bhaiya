export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'admin';
  phone?: string;
  skills?: string[];
  resume?: string;
  linkedinUrl?: string;
  createdAt: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  techStack: string[];
  requirements: string[];
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  salaryRange?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobId: string;
  scheduledAt: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  transcript: ChatMessage[];
  aiSummary?: string;
  performanceScore?: number;
  feedback?: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  sender: 'candidate' | 'ai';
  message: string;
  timestamp: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'candidate' | 'admin') => Promise<boolean>;
  signup: (userData: Partial<User>, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}