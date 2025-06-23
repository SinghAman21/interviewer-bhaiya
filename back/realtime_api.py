# realtime_api.py - Real-time API service for frontend integration

import requests
import json
from typing import Dict, List, Optional

class InterviewPlatformAPI:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.token = None
        self.headers = {"Content-Type": "application/json"}
    
    def _update_headers(self):
        """Update headers with authentication token"""
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, files: Optional[Dict] = None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers)
            elif method.upper() == "POST":
                if files:
                    # Remove Content-Type for file uploads
                    headers = {k: v for k, v in self.headers.items() if k != "Content-Type"}
                    response = requests.post(url, headers=headers, files=files, data=data)
                else:
                    response = requests.post(url, headers=self.headers, json=data)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=self.headers, json=data)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=self.headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response.json() if response.content else {}
        
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}
        except json.JSONDecodeError:
            return {"success": False, "error": "Invalid JSON response"}
    
    # Authentication Methods
    def login(self, email: str, password: str, role: str = None) -> Dict:
        """User login"""
        data = {"email": email, "password": password}
        if role:
            data["role"] = role
        
        response = self._make_request("POST", "/auth/login", data)
        
        if response.get("success") and "access_token" in response:
            self.token = response["access_token"]
            self._update_headers()
        
        return response
    
    def register(self, user_data: Dict) -> Dict:
        """User registration"""
        response = self._make_request("POST", "/auth/register", user_data)
        
        if response.get("success") and "access_token" in response:
            self.token = response["access_token"]
            self._update_headers()
        
        return response
    
    def get_profile(self) -> Dict:
        """Get user profile"""
        return self._make_request("GET", "/auth/profile")
    
    def update_profile(self, user_data: Dict) -> Dict:
        """Update user profile"""
        return self._make_request("PUT", "/auth/profile", user_data)
    
    def logout(self):
        """Logout user"""
        self.token = None
        self.headers = {"Content-Type": "application/json"}
    
    # Job Management Methods
    def get_jobs(self) -> Dict:
        """Get all jobs"""
        return self._make_request("GET", "/jobs")
    
    def get_job_by_id(self, job_id: str) -> Dict:
        """Get job by ID"""
        return self._make_request("GET", f"/jobs/{job_id}")
    
    def create_job(self, job_data: Dict) -> Dict:
        """Create new job (Admin only)"""
        return self._make_request("POST", "/jobs", job_data)
    
    def update_job(self, job_id: str, job_data: Dict) -> Dict:
        """Update job (Admin only)"""
        return self._make_request("PUT", f"/jobs/{job_id}", job_data)
    
    def delete_job(self, job_id: str) -> Dict:
        """Delete job (Admin only)"""
        return self._make_request("DELETE", f"/jobs/{job_id}")
    
    # Interview Management Methods
    def get_interviews(self) -> Dict:
        """Get user's interviews"""
        return self._make_request("GET", "/interviews")
    
    def schedule_interview(self, job_id: str, scheduled_at: str) -> Dict:
        """Schedule new interview"""
        data = {
            "job_id": job_id,
            "scheduled_at": scheduled_at
        }
        return self._make_request("POST", "/interviews", data)
    
    def get_interview_by_id(self, interview_id: str) -> Dict:
        """Get interview by ID"""
        return self._make_request("GET", f"/interviews/{interview_id}")
    
    def add_chat_message(self, interview_id: str, sender: str, message: str) -> Dict:
        """Add message to interview transcript"""
        data = {
            "sender": sender,
            "message": message
        }
        return self._make_request("POST", f"/interviews/{interview_id}/messages", data)
    
    def complete_interview(self, interview_id: str, ai_summary: str, performance_score: float, feedback: str) -> Dict:
        """Complete interview with results"""
        data = {
            "ai_summary": ai_summary,
            "performance_score": performance_score,
            "feedback": feedback
        }
        return self._make_request("POST", f"/interviews/{interview_id}/complete", data)
    
    # Resume and Question Methods
    def upload_resume(self, file_path: str) -> Dict:
        """Upload resume and generate questions"""
        with open(file_path, 'rb') as f:
            files = {"resume": f}
            response = self._make_request("POST", "/uploadcv", files=files)
        return response
    
    def submit_answers(self, answers: List[Dict]) -> Dict:
        """Submit interview answers for evaluation"""
        return self._make_request("POST", "/submitqna", answers)
    
    def get_interview_summary(self, performance_score: float, ai_summary: str) -> Dict:
        """Get interview summary"""
        data = {
            "performanceScore": performance_score,
            "aiSummary": ai_summary
        }
        return self._make_request("POST", "/interview-summary", data)
    
    # Activity Methods
    def get_activities(self) -> Dict:
        """Get user activities"""
        return self._make_request("GET", "/activities")
    
    # Mock AI Response (for chat simulation)
    def generate_ai_response(self, user_message: str, context: List[Dict] = None) -> Dict:
        """Generate AI response for chat interview"""
        # This could be enhanced to call a real AI service
        # For now, return a simple response
        responses = [
            "That's an interesting point. Can you elaborate on that?",
            "Great! Now, let me ask you about your experience with...",
            "I see. How would you handle a situation where...",
            "Excellent answer! Moving on to the next question...",
            "Can you walk me through your thought process on that?",
            "That's a good approach. What challenges did you face when implementing that?",
            "I understand. What would you do differently next time?",
            "Perfect! Let's discuss your experience with team collaboration.",
            "Interesting! How do you stay updated with the latest technologies?",
            "Thank you for that detailed explanation. Let's move forward."
        ]
        
        import random
        response_message = random.choice(responses)
        
        return {
            "success": True,
            "message": response_message
        }

# Example usage
if __name__ == "__main__":
    # Initialize API client
    api = InterviewPlatformAPI()
    
    # Test login
    login_response = api.login("john@example.com", "candidate123", "candidate")
    print("Login Response:", login_response)
    
    if login_response.get("success"):
        # Test getting jobs
        jobs_response = api.get_jobs()
        print("Jobs Response:", jobs_response)
        
        # Test getting profile
        profile_response = api.get_profile()
        print("Profile Response:", profile_response)
        
        # Test getting interviews
        interviews_response = api.get_interviews()
        print("Interviews Response:", interviews_response)
        
        # Test getting activities
        activities_response = api.get_activities()
        print("Activities Response:", activities_response)
