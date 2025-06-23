# database.py - MongoDB Configuration and Models with fallback to in-memory storage

from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import os
import json
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class InMemoryDB:
    """Fallback in-memory database when MongoDB is not available"""
    def __init__(self):
        self.users = []
        self.jobs = []
        self.interviews = []
        self.questions = []
        self.activities = []
        print("🔄 Using in-memory database (MongoDB not available)")
    
    def get_collection(self, collection_name):
        return getattr(self, collection_name, [])

class MongoDB:
    def __init__(self):
        # MongoDB connection string - you can use MongoDB Atlas or local MongoDB
        self.connection_string = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = os.getenv('DB_NAME', 'ai_interview_platform')
        
        try:
            self.client = MongoClient(self.connection_string, serverSelectionTimeoutMS=5000)
            # Test the connection
            self.client.server_info()
            self.db = self.client[self.db_name]
            print("✅ Connected to MongoDB successfully!")
            self.use_mongodb = True
        except Exception as e:
            print(f"⚠️ MongoDB connection failed: {e}")
            print("🔄 Falling back to in-memory storage")
            self.use_mongodb = False
            self.in_memory_db = InMemoryDB()
    
    def get_collection(self, collection_name):
        if self.use_mongodb:
            return self.db[collection_name]
        else:
            return getattr(self.in_memory_db, collection_name, [])

# Initialize MongoDB connection
mongo_db = MongoDB()

# Helper functions for database operations
def create_id():
    """Create a new ID - ObjectId for MongoDB, UUID for in-memory"""
    if mongo_db.use_mongodb:
        return ObjectId()
    else:
        return str(uuid.uuid4())

def convert_id(id_value):
    """Convert ID to appropriate format"""
    if mongo_db.use_mongodb:
        return ObjectId(id_value) if isinstance(id_value, str) else id_value
    else:
        return str(id_value)

# Collections
users_collection = mongo_db.get_collection('users')
jobs_collection = mongo_db.get_collection('jobs')
interviews_collection = mongo_db.get_collection('interviews')
questions_collection = mongo_db.get_collection('questions')
activities_collection = mongo_db.get_collection('activities')

class User:
    @staticmethod
    def create_user(user_data):
        """Create a new user"""
        # Hash password
        if 'password' in user_data:
            user_data['password_hash'] = generate_password_hash(user_data['password'])
            del user_data['password']
        
        user_data['created_at'] = datetime.utcnow()
        user_data['updated_at'] = datetime.utcnow()
        user_data['is_active'] = True
        
        if mongo_db.use_mongodb:
            result = users_collection.insert_one(user_data)
            user_data['_id'] = result.inserted_id
        else:
            user_data['_id'] = create_id()
            users_collection.append(user_data)
        
        return user_data
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        if mongo_db.use_mongodb:
            return users_collection.find_one({'email': email})
        else:
            for user in users_collection:
                if user.get('email') == email:
                    return user
            return None
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        if mongo_db.use_mongodb:
            return users_collection.find_one({'_id': ObjectId(user_id)})
        else:
            for user in users_collection:
                if str(user.get('_id')) == str(user_id):
                    return user
            return None
    
    @staticmethod
    def verify_password(user, password):
        """Verify user password"""
        return check_password_hash(user['password_hash'], password)
    
    @staticmethod
    def update_user(user_id, update_data):
        """Update user data"""
        update_data['updated_at'] = datetime.utcnow()
        
        if mongo_db.use_mongodb:
            return users_collection.update_one(
                {'_id': ObjectId(user_id)}, 
                {'$set': update_data}
            )
        else:
            for i, user in enumerate(users_collection):
                if str(user.get('_id')) == str(user_id):
                    users_collection[i].update(update_data)
                    return users_collection[i]
            return None
    
    @staticmethod
    def get_all_candidates():
        """Get all candidates"""
        return list(users_collection.find({'role': 'candidate'}))

class Job:
    @staticmethod
    def create_job(job_data):
        """Create a new job"""
        job_data['created_at'] = datetime.utcnow()
        job_data['updated_at'] = datetime.utcnow()
        job_data['is_active'] = True
        
        result = jobs_collection.insert_one(job_data)
        job_data['_id'] = result.inserted_id
        return job_data
    
    @staticmethod
    def find_by_id(job_id):
        """Find job by ID"""
        return jobs_collection.find_one({'_id': ObjectId(job_id)})
    
    @staticmethod
    def get_all_jobs():
        """Get all active jobs"""
        return list(jobs_collection.find({'is_active': True}))
    
    @staticmethod
    def update_job(job_id, update_data):
        """Update job data"""
        update_data['updated_at'] = datetime.utcnow()
        return jobs_collection.update_one(
            {'_id': ObjectId(job_id)}, 
            {'$set': update_data}
        )
    
    @staticmethod
    def delete_job(job_id):
        """Delete job (soft delete)"""
        return jobs_collection.update_one(
            {'_id': ObjectId(job_id)}, 
            {'$set': {'is_active': False, 'updated_at': datetime.utcnow()}}
        )

class Interview:
    @staticmethod
    def create_interview(interview_data):
        """Create a new interview"""
        interview_data['created_at'] = datetime.utcnow()
        interview_data['updated_at'] = datetime.utcnow()
        interview_data['transcript'] = []
        
        result = interviews_collection.insert_one(interview_data)
        interview_data['_id'] = result.inserted_id
        return interview_data
    
    @staticmethod
    def find_by_id(interview_id):
        """Find interview by ID"""
        return interviews_collection.find_one({'_id': ObjectId(interview_id)})
    
    @staticmethod
    def get_by_candidate(candidate_id):
        """Get interviews by candidate"""
        return list(interviews_collection.find({'candidate_id': candidate_id}))
    
    @staticmethod
    def get_all_interviews():
        """Get all interviews"""
        return list(interviews_collection.find())
    
    @staticmethod
    def update_interview(interview_id, update_data):
        """Update interview data"""
        update_data['updated_at'] = datetime.utcnow()
        return interviews_collection.update_one(
            {'_id': ObjectId(interview_id)}, 
            {'$set': update_data}
        )
    
    @staticmethod
    def add_message(interview_id, message):
        """Add message to interview transcript"""
        return interviews_collection.update_one(
            {'_id': ObjectId(interview_id)},
            {
                '$push': {'transcript': message},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )

class Question:
    @staticmethod
    def save_questions(resume_path, questions):
        """Save generated questions"""
        question_data = {
            'resume_path': resume_path,
            'questions': questions,
            'created_at': datetime.utcnow()
        }
        
        result = questions_collection.insert_one(question_data)
        return result.inserted_id
    
    @staticmethod
    def get_questions_by_resume(resume_path):
        """Get questions by resume path"""
        return questions_collection.find_one({'resume_path': resume_path})

class Activity:
    @staticmethod
    def log_activity(user_id, activity_type, description, metadata=None):
        """Log user activity"""
        activity_data = {
            'user_id': user_id,
            'activity_type': activity_type,  # login, logout, interview_start, interview_complete, etc.
            'description': description,
            'metadata': metadata or {},
            'timestamp': datetime.utcnow(),
            'ip_address': None,  # Can be set from request
            'user_agent': None   # Can be set from request
        }
        
        result = activities_collection.insert_one(activity_data)
        return result.inserted_id
    
    @staticmethod
    def get_user_activities(user_id, limit=50):
        """Get user activities"""
        return list(activities_collection.find(
            {'user_id': user_id}
        ).sort('timestamp', -1).limit(limit))
    
    @staticmethod
    def get_all_activities(limit=100):
        """Get all activities for admin"""
        return list(activities_collection.find().sort('timestamp', -1).limit(limit))

# Utility functions
def json_serializer(obj):
    """JSON serializer for MongoDB ObjectId"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def prepare_user_response(user):
    """Prepare user data for API response (remove sensitive info)"""
    if user:
        user_copy = user.copy()
        user_copy.pop('password_hash', None)
        user_copy['id'] = str(user_copy['_id'])
        return user_copy
    return None

# Initialize default admin user if not exists
def init_default_admin():
    """Initialize default admin user"""
    admin_email = "admin@bolt.new"
    existing_admin = User.find_by_email(admin_email)
    
    if not existing_admin:
        admin_data = {
            'email': admin_email,
            'name': 'System Admin',
            'role': 'admin',
            'password': 'admin123',  # Change this in production
            'phone': None,
            'skills': [],
            'resume': None,
            'linkedinUrl': None
        }
        
        admin_user = User.create_user(admin_data)
        print(f"✅ Default admin user created: {admin_email}")
        Activity.log_activity(
            str(admin_user['_id']), 
            'user_creation', 
            'Default admin user created'
        )
    else:
        print("ℹ️ Default admin user already exists")

# Initialize sample data
def init_sample_data():
    """Initialize sample jobs and candidate"""
    # Create sample candidate
    candidate_email = "john@example.com"
    existing_candidate = User.find_by_email(candidate_email)
    
    if not existing_candidate:
        candidate_data = {
            'email': candidate_email,
            'name': 'John Doe',
            'role': 'candidate',
            'password': 'candidate123',
            'phone': '+1-234-567-8900',
            'skills': ['JavaScript', 'React', 'Node.js'],
            'resume': None,
            'linkedinUrl': 'https://linkedin.com/in/johndoe'
        }
        
        candidate_user = User.create_user(candidate_data)
        print(f"✅ Sample candidate created: {candidate_email}")
        Activity.log_activity(
            str(candidate_user['_id']), 
            'user_creation', 
            'Sample candidate user created'
        )
    
    # Create sample jobs
    sample_jobs = [
        {
            'title': 'Senior Frontend Developer',
            'company': 'TechCorp Inc.',
            'description': 'We are looking for a senior frontend developer to join our team and work on cutting-edge web applications.',
            'techStack': ['React', 'TypeScript', 'Node.js', 'GraphQL'],
            'requirements': ['5+ years React experience', 'TypeScript proficiency', 'Team collaboration'],
            'location': 'San Francisco, CA',
            'type': 'full-time',
            'salaryRange': '$120k - $160k',
            'createdBy': 'admin1'
        },
        {
            'title': 'Full Stack Developer',
            'company': 'StartupXYZ',
            'description': 'Join our fast-growing startup and build amazing products from ground up.',
            'techStack': ['Python', 'Django', 'React', 'PostgreSQL'],
            'requirements': ['3+ years full-stack experience', 'Python/Django expertise', 'Startup mindset'],
            'location': 'Remote',
            'type': 'full-time',
            'salaryRange': '$80k - $120k',
            'createdBy': 'admin1'
        }
    ]
    
    existing_jobs = Job.get_all_jobs()
    if len(existing_jobs) == 0:
        for job_data in sample_jobs:
            Job.create_job(job_data)
        print("✅ Sample jobs created")

# Initialize database
if __name__ == "__main__":
    init_default_admin()
    init_sample_data()
    print("🚀 Database initialization complete!")
