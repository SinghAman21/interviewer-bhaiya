# simple_database.py - Simple fallback database for demo purposes

from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import uuid

# In-memory storage
users_db = []
jobs_db = []
interviews_db = []
questions_db = []
activities_db = []

def generate_id():
    """Generate a simple string ID"""
    return str(uuid.uuid4())

def prepare_user_response(user):
    """Prepare user data for JSON response"""
    user_copy = user.copy()
    user_copy['id'] = user_copy.get('_id', user_copy.get('id'))
    user_copy.pop('password', None)  # Never send password
    user_copy.pop('password_hash', None)  # Never send password hash
    return user_copy

def json_serializer(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

class User:
    @staticmethod
    def create_user(user_data):
        """Create a new user"""
        user = {
            '_id': generate_id(),
            'email': user_data['email'],
            'name': user_data['name'],
            'role': user_data['role'],
            'password_hash': generate_password_hash(user_data['password']),
            'phone': user_data.get('phone'),
            'skills': user_data.get('skills', []),
            'linkedinUrl': user_data.get('linkedinUrl'),
            'created_at': datetime.utcnow()
        }
        users_db.append(user)
        return user
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        for user in users_db:
            if user['email'] == email:
                return user
        return None
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        for user in users_db:
            if str(user['_id']) == str(user_id):
                return user
        return None
    
    @staticmethod
    def verify_password(user, password):
        """Verify user password"""
        return check_password_hash(user['password_hash'], password)
    
    @staticmethod
    def update_user(user_id, update_data):
        """Update user data"""
        for i, user in enumerate(users_db):
            if str(user['_id']) == str(user_id):
                users_db[i].update(update_data)
                return users_db[i]
        return None

class Job:
    @staticmethod
    def create_job(job_data):
        """Create a new job"""
        job = {
            '_id': generate_id(),
            'title': job_data['title'],
            'company': job_data['company'],
            'description': job_data['description'],
            'techStack': job_data['techStack'],
            'requirements': job_data['requirements'],
            'location': job_data['location'],
            'type': job_data['type'],
            'salaryRange': job_data.get('salaryRange'),
            'createdBy': job_data['createdBy'],
            'created_at': datetime.utcnow()
        }
        jobs_db.append(job)
        return job
    
    @staticmethod
    def get_all_jobs():
        """Get all jobs"""
        return jobs_db
    
    @staticmethod
    def find_by_id(job_id):
        """Find job by ID"""
        for job in jobs_db:
            if str(job['_id']) == str(job_id):
                return job
        return None
    
    @staticmethod
    def update_job(job_id, update_data):
        """Update job"""
        for i, job in enumerate(jobs_db):
            if str(job['_id']) == str(job_id):
                jobs_db[i].update(update_data)
                return jobs_db[i]
        return None
    
    @staticmethod
    def delete_job(job_id):
        """Delete job"""
        global jobs_db
        jobs_db = [job for job in jobs_db if str(job['_id']) != str(job_id)]
        return True

class Interview:
    @staticmethod
    def create_interview(interview_data):
        """Create a new interview"""
        interview = {
            '_id': generate_id(),
            'candidate_id': interview_data['candidate_id'],
            'job_id': interview_data['job_id'],
            'scheduled_at': interview_data['scheduled_at'],
            'status': interview_data['status'],
            'transcript': [],
            'ai_summary': None,
            'performance_score': None,
            'feedback': None,
            'created_at': datetime.utcnow()
        }
        interviews_db.append(interview)
        return interview
    
    @staticmethod
    def get_all_interviews():
        """Get all interviews"""
        return interviews_db
    
    @staticmethod
    def get_by_candidate(candidate_id):
        """Get interviews by candidate"""
        return [interview for interview in interviews_db if interview['candidate_id'] == candidate_id]
    
    @staticmethod
    def find_by_id(interview_id):
        """Find interview by ID"""
        for interview in interviews_db:
            if str(interview['_id']) == str(interview_id):
                return interview
        return None
    
    @staticmethod
    def update_interview(interview_id, update_data):
        """Update interview"""
        for i, interview in enumerate(interviews_db):
            if str(interview['_id']) == str(interview_id):
                interviews_db[i].update(update_data)
                return interviews_db[i]
        return None
    
    @staticmethod
    def add_message(interview_id, message_data):
        """Add message to interview transcript"""
        for interview in interviews_db:
            if str(interview['_id']) == str(interview_id):
                interview['transcript'].append(message_data)
                return True
        return False

class Question:
    @staticmethod
    def save_questions(resume_path, questions):
        """Save questions to database"""
        question_doc = {
            '_id': generate_id(),
            'resume_path': resume_path,
            'questions': questions,
            'created_at': datetime.utcnow()
        }
        questions_db.append(question_doc)
        return question_doc

class Activity:
    @staticmethod
    def log_activity(user_id, activity_type, description):
        """Log user activity"""
        activity = {
            '_id': generate_id(),
            'user_id': user_id,
            'activity_type': activity_type,
            'description': description,
            'timestamp': datetime.utcnow()
        }
        activities_db.append(activity)
        return activity
    
    @staticmethod
    def get_all_activities():
        """Get all activities"""
        return activities_db
    
    @staticmethod
    def get_user_activities(user_id):
        """Get activities for a specific user"""
        return [activity for activity in activities_db if activity['user_id'] == user_id]

def init_default_admin():
    """Initialize default admin user"""
    admin_email = "admin@bolt.new"
    if not User.find_by_email(admin_email):
        admin_data = {
            'email': admin_email,
            'name': 'Admin User',
            'role': 'admin',
            'password': 'admin123'
        }
        User.create_user(admin_data)
        print("✅ Default admin user created: admin@bolt.new / admin123")

def init_sample_data():
    """Initialize sample data"""
    # Create sample candidate
    candidate_email = "john@example.com"
    if not User.find_by_email(candidate_email):
        candidate_data = {
            'email': candidate_email,
            'name': 'John Doe',
            'role': 'candidate',
            'password': 'candidate123',
            'phone': '+1-234-567-8900',
            'skills': ['JavaScript', 'React', 'Node.js'],
            'linkedinUrl': 'https://linkedin.com/in/johndoe'
        }
        User.create_user(candidate_data)
        print("✅ Sample candidate created: john@example.com / candidate123")
    
    # Create sample jobs if none exist
    if len(jobs_db) == 0:
        admin = User.find_by_email("admin@bolt.new")
        if admin:
            sample_jobs = [
                {
                    'title': 'Senior Frontend Developer',
                    'company': 'TechCorp Inc.',
                    'description': 'We are looking for a senior frontend developer to join our team.',
                    'techStack': ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
                    'requirements': ['5+ years experience', 'Strong React skills', 'Experience with TypeScript'],
                    'location': 'San Francisco, CA',
                    'type': 'full-time',
                    'salaryRange': '$120k - $150k',
                    'createdBy': admin['_id']
                },
                {
                    'title': 'Full Stack Developer',
                    'company': 'StartupXYZ',
                    'description': 'Join our fast-growing startup as a full stack developer.',
                    'techStack': ['Node.js', 'React', 'MongoDB', 'AWS'],
                    'requirements': ['3+ years full stack experience', 'Experience with cloud platforms'],
                    'location': 'Remote',
                    'type': 'full-time',
                    'salaryRange': '$90k - $120k',
                    'createdBy': admin['_id']
                }
            ]
            
            for job_data in sample_jobs:
                Job.create_job(job_data)
            
            print("✅ Sample jobs created")
    
    # Create sample interviews if none exist
    if len(interviews_db) == 0:
        candidate = User.find_by_email("john@example.com")
        jobs = Job.get_all_jobs()
        
        if candidate and len(jobs) > 0:
            sample_interviews = [
                {
                    'candidate_id': candidate['_id'],
                    'job_id': jobs[0]['_id'],
                    'scheduled_at': datetime.utcnow() + timedelta(days=1),
                    'status': 'scheduled'
                },
                {
                    'candidate_id': candidate['_id'],
                    'job_id': jobs[1]['_id'] if len(jobs) > 1 else jobs[0]['_id'],
                    'scheduled_at': datetime.utcnow() + timedelta(days=2),
                    'status': 'scheduled'
                }
            ]
            
            for interview_data in sample_interviews:
                Interview.create_interview(interview_data)
            
            print("✅ Sample interviews created")
