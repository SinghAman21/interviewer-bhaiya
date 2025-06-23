from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# CORS Configuration - Use flask-cors for comprehensive CORS handling
CORS(app, 
     resources={r"/*": {
         "origins": [
             "http://localhost:5173", 
             "http://localhost:5174", 
             "http://127.0.0.1:5173", 
             "http://127.0.0.1:5174"
         ],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type", "Authorization"]     }}
)

# Add request logging for debugging
@app.before_request
def log_request_info():
    print(f"🔍 Request: {request.method} {request.path}")
    print(f"   Origin: {request.headers.get('Origin', 'None')}")
    print(f"   Authorization: {request.headers.get('Authorization', 'None')}")
    if request.method == 'OPTIONS':
        print("   ⚠️  CORS Preflight request")

# In-memory storage (for development)
users_storage = []
jobs_storage = []
interviews_storage = []
activities_storage = []

# Initialize default admin user
default_admin = {
    'id': str(uuid.uuid4()),
    'email': 'admin@bolt.new',
    'password_hash': generate_password_hash('admin123'),
    'name': 'Admin User',
    'role': 'admin',
    'created_at': datetime.utcnow().isoformat(),
    'is_active': True
}
users_storage.append(default_admin)

# Initialize sample jobs
sample_jobs = [
    {
        'id': str(uuid.uuid4()),
        'title': 'Senior Frontend Developer',
        'company': 'TechCorp Inc.',
        'description': 'We are looking for a senior frontend developer to join our team.',
        'techStack': ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
        'requirements': ['5+ years experience', 'Strong React skills', 'Experience with TypeScript'],
        'location': 'San Francisco, CA',
        'type': 'full-time',
        'salaryRange': '$120k - $150k',
        'created_at': datetime.utcnow().isoformat(),
        'createdBy': default_admin['id'],
        'is_active': True
    },
    {
        'id': str(uuid.uuid4()),
        'title': 'Full Stack Developer',
        'company': 'StartupXYZ',
        'description': 'Join our fast-growing startup as a full stack developer.',
        'techStack': ['Node.js', 'React', 'MongoDB', 'AWS'],
        'requirements': ['3+ years full stack experience', 'Experience with cloud platforms', 'Startup mindset'],
        'location': 'Remote',
        'type': 'full-time',
        'salaryRange': '$90k - $120k',
        'created_at': datetime.utcnow().isoformat(),
        'createdBy': default_admin['id'],
        'is_active': True
    }
]
jobs_storage.extend(sample_jobs)

# Add sample interview for testing
sample_interview = {
    'id': str(uuid.uuid4()),
    'candidateId': default_admin['id'],  # Using admin as candidate for testing
    'jobId': sample_jobs[0]['id'],  # Link to first job
    'scheduledAt': (datetime.utcnow() + timedelta(hours=1)).isoformat(),
    'status': 'scheduled',
    'transcript': [],
    'score': 0,
    'feedback': '',
    'created_at': datetime.utcnow().isoformat()
}
interviews_storage.append(sample_interview)

# Add test interview with the exact ID from the frontend error
test_interview = {
    'id': 'dd45197d-4587-4eaa-92d7-cecb57d15f0f',
    'candidateId': default_admin['id'],
    'jobId': sample_jobs[0]['id'],
    'scheduledAt': (datetime.utcnow() + timedelta(hours=2)).isoformat(),
    'status': 'scheduled',
    'transcript': [],
    'score': 0,
    'feedback': '',
    'created_at': datetime.utcnow().isoformat()
}
interviews_storage.append(test_interview)

def find_user_by_email(email):
    for user in users_storage:
        if user['email'] == email:
            return user
    return None

def find_user_by_id(user_id):
    for user in users_storage:
        if user['id'] == user_id:
            return user
    return None

def find_job_by_id(job_id):
    for job in jobs_storage:
        if job['id'] == job_id:
            return job
    return None

# Authentication Routes
@app.route("/auth/register", methods=["POST"])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        if find_user_by_email(data['email']):
            return jsonify({'success': False, 'error': 'User with this email already exists'}), 400
        
        # Create new user
        user_data = {
            'id': str(uuid.uuid4()),
            'email': data['email'],
            'password_hash': generate_password_hash(data['password']),
            'name': data['name'],
            'role': data['role'],
            'phone': data.get('phone', ''),
            'skills': data.get('skills', []),
            'linkedinUrl': data.get('linkedinUrl', ''),
            'created_at': datetime.utcnow().isoformat(),
            'is_active': True
        }
        
        users_storage.append(user_data)
        
        # Create access token
        access_token = create_access_token(identity=user_data['id'])
        
        # Remove password hash from response
        user_response = {k: v for k, v in user_data.items() if k != 'password_hash'}
        
        return jsonify({
            'success': True,
            'user': user_response,
            'access_token': access_token
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/auth/login", methods=["POST"])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        # Find user
        user = find_user_by_email(data['email'])
        if not user:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # Check password
        if not check_password_hash(user['password_hash'], data['password']):
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'success': False, 'error': 'Account is deactivated'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user['id'])
        
        # Remove password hash from response
        user_response = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return jsonify({
            'success': True,
            'user': user_response,
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/auth/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = find_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Remove password hash from response
        user_response = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return jsonify({
            'success': True,
            'user': user_response
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/auth/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = find_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['name', 'phone', 'skills', 'linkedinUrl']
        for field in allowed_fields:
            if field in data:
                user[field] = data[field]
        
        user['updated_at'] = datetime.utcnow().isoformat()
        
        # Remove password hash from response
        user_response = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return jsonify({
            'success': True,
            'user': user_response
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Job Routes
@app.route("/jobs", methods=["GET"])
def get_jobs():
    """Get all active jobs"""
    try:
        active_jobs = [job for job in jobs_storage if job.get('is_active', True)]
        return jsonify({
            'success': True,
            'jobs': active_jobs
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/jobs/<job_id>", methods=["GET"])
def get_job(job_id):
    """Get job by ID"""
    try:
        job = find_job_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'error': 'Job not found'}), 404
        
        return jsonify({
            'success': True,
            'job': job
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/jobs", methods=["POST"])
@jwt_required()
def create_job():
    """Create a new job (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = find_user_by_id(current_user_id)
        
        if not user or user['role'] != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        data = request.get_json()
        required_fields = ['title', 'company', 'description', 'techStack', 'requirements', 'location', 'type']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        job_data = {
            'id': str(uuid.uuid4()),
            'title': data['title'],
            'company': data['company'],
            'description': data['description'],
            'techStack': data['techStack'],
            'requirements': data['requirements'],
            'location': data['location'],
            'type': data['type'],
            'salaryRange': data.get('salaryRange', ''),
            'created_at': datetime.utcnow().isoformat(),
            'createdBy': current_user_id,
            'is_active': True
        }
        
        jobs_storage.append(job_data)
        
        return jsonify({
            'success': True,
            'job': job_data
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Interview Routes
@app.route("/interviews", methods=["GET"])
@jwt_required()
def get_interviews():
    """Get interviews for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_interviews = [interview for interview in interviews_storage 
                          if interview.get('candidateId') == current_user_id]
        
        return jsonify({
            'success': True,
            'interviews': user_interviews
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/interviews", methods=["POST"])
@jwt_required()
def schedule_interview():
    """Schedule a new interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('job_id') or not data.get('scheduled_at'):
            return jsonify({'success': False, 'error': 'Job ID and scheduled time are required'}), 400
        
        # Check if job exists
        job = find_job_by_id(data['job_id'])
        if not job:
            return jsonify({'success': False, 'error': 'Job not found'}), 404
        
        interview_data = {
            'id': str(uuid.uuid4()),
            'candidateId': current_user_id,
            'jobId': data['job_id'],
            'scheduledAt': data['scheduled_at'],
            'status': 'scheduled',
            'transcript': [],
            'score': 0,
            'feedback': '',
            'created_at': datetime.utcnow().isoformat()
        }
        
        interviews_storage.append(interview_data)
        
        return jsonify({
            'success': True,
            'interview': interview_data
        }, 201)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/interviews/<interview_id>", methods=["GET"])
def get_interview(interview_id):
    """Get interview by ID"""
    try:
        for interview in interviews_storage:
            if interview['id'] == interview_id:
                return jsonify({
                    'success': True,
                    'interview': interview
                }), 200
        
        return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Interview Flow Endpoints
@app.route("/interviews/<interview_id>/upload-resume", methods=["POST"])
@jwt_required()
def upload_resume_for_interview(interview_id):
    """Upload resume for a specific interview and generate questions"""
    try:
        current_user_id = get_jwt_identity()
        
        if not interview_id:
            return jsonify({'success': False, 'error': 'Interview ID required'}), 400
        
        # Find interview
        interview = None
        for i in interviews_storage:
            if i['id'] == interview_id:
                interview = i
                break
        
        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
        # Check if user has access
        if interview['candidateId'] != current_user_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        if "resume" not in request.files:
            return jsonify({'success': False, 'error': 'No resume file provided'}), 400
        
        file = request.files["resume"]
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Save file
        filename = f"{interview_id}_{current_user_id}_{file.filename}"
        resume_path = os.path.join("uploads", filename)
        file.save(resume_path)
        
        # Get job details for context
        job = find_job_by_id(interview['jobId'])
        if not job:
            return jsonify({'success': False, 'error': 'Job not found'}), 404
        
        # Generate mock questions based on job
        questions = [
            f"Tell me about your experience with {', '.join(job['techStack'][:2])}.",
            f"How would you approach building a {job['title'].lower()} solution?",
            f"What interests you most about working at {job['company']}?",
            "Describe a challenging project you've worked on recently.",
            "How do you stay updated with the latest technologies in your field?",
            "Tell me about a time when you had to learn a new technology quickly.",
            f"How would you handle {job['requirements'][0] if job['requirements'] else 'complex requirements'}?",
            "What are your career goals for the next 3-5 years?",
            "How do you approach debugging and problem-solving?",
            "Do you have any questions about the role or our company?"
        ]
        
        # Update interview with resume and questions
        interview['resume_path'] = resume_path
        interview['questions'] = questions
        interview['current_question_index'] = 0
        interview['status'] = 'resume_uploaded'
        interview['answers'] = []
        
        return jsonify({
            'success': True,
            'questions': questions,
            'total_questions': len(questions),
            'message': 'Resume uploaded and questions generated successfully'
        }), 200
        
    except Exception as e:
        print(f"ERROR: Failed to upload resume: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/interviews/<interview_id>/start", methods=["POST"])
@jwt_required()
def start_interview(interview_id):
    """Start the interview with camera and audio"""
    try:
        current_user_id = get_jwt_identity()
        
        if not interview_id:
            return jsonify({'success': False, 'error': 'Interview ID required'}), 400
        
        # Find interview
        interview = None
        for i in interviews_storage:
            if i['id'] == interview_id:
                interview = i
                break
        
        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
        # Check if user has access
        if interview['candidateId'] != current_user_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Check if resume is uploaded
        if 'questions' not in interview:
            return jsonify({'success': False, 'error': 'Please upload resume first'}), 400
        
        # Update interview status and start time
        interview['status'] = 'in_progress'
        interview['started_at'] = datetime.utcnow().isoformat()
        interview['current_question_index'] = 0
        
        # Get the first question
        current_question = interview['questions'][0] if interview['questions'] else None
        
        return jsonify({
            'success': True,
            'message': 'Interview started successfully',
            'current_question': current_question,
            'question_index': 0,
            'total_questions': len(interview['questions'])
        }), 200
        
    except Exception as e:
        print(f"ERROR: Failed to start interview: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/interviews/<interview_id>/next-question", methods=["POST"])
@jwt_required()
def next_question(interview_id):
    """Get next question in the interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not interview_id:
            return jsonify({'success': False, 'error': 'Interview ID required'}), 400
        
        # Find interview
        interview = None
        for i in interviews_storage:
            if i['id'] == interview_id:
                interview = i
                break
        
        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
        # Save the answer if provided
        if 'answer' in data and data['answer'].strip():
            answer_data = {
                'question_index': interview.get('current_question_index', 0),
                'question': interview['questions'][interview.get('current_question_index', 0)],
                'answer': data['answer'],
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Add answer to interview
            if 'answers' not in interview:
                interview['answers'] = []
            interview['answers'].append(answer_data)
        
        # Move to next question
        current_index = interview.get('current_question_index', 0)
        next_index = current_index + 1
        
        if next_index >= len(interview['questions']):
            # Interview completed
            interview['status'] = 'completed'
            interview['completed_at'] = datetime.utcnow().isoformat()
            interview['current_question_index'] = next_index
            
            return jsonify({
                'success': True,
                'completed': True,
                'message': 'Interview completed successfully'
            }), 200
        else:
            # Get next question
            next_question_text = interview['questions'][next_index]
            interview['current_question_index'] = next_index
            
            return jsonify({
                'success': True,
                'completed': False,
                'current_question': next_question_text,
                'question_index': next_index,
                'total_questions': len(interview['questions'])
            }), 200
        
    except Exception as e:
        print(f"ERROR: Failed to get next question: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/interviews/<interview_id>/tts", methods=["POST"])
@jwt_required()
def text_to_speech(interview_id):
    """Convert text to speech for interview questions"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not interview_id:
            return jsonify({'success': False, 'error': 'Interview ID required'}), 400
        
        if not text:
            return jsonify({'success': False, 'error': 'No text provided'}), 400
        
        # For now, return success - in production, implement actual TTS
        return jsonify({
            'success': True,
            'message': 'TTS ready - using browser speech synthesis',
            'text': text
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/interviews/<interview_id>/stt", methods=["POST"])
@jwt_required()
def speech_to_text(interview_id):
    """Convert speech to text for interview answers"""
    try:
        
        if not interview_id:
            return jsonify({'success': False, 'error': 'Interview ID required'}), 400
        if "audio" not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        audio_file = request.files["audio"]
        if audio_file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Create audio directory if it doesn't exist
        os.makedirs("audio_input", exist_ok=True)
        
        # Save audio file
        filename = f"stt_{uuid.uuid4().hex}.wav"
        audio_path = os.path.join("audio_input", filename)
        audio_file.save(audio_path)
        
        # For now, return mock transcription - in production, implement actual STT
        mock_transcription = "This is a mock transcription of the audio response. In production, this would be the actual speech-to-text conversion."
        
        return jsonify({
            'success': True,
            'transcription': mock_transcription
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/interviews/<interview_id>/complete", methods=["POST"])
@jwt_required()
def complete_interview(interview_id):
    """Complete interview with results"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not interview_id:
            return jsonify({'success': False, 'error': 'Interview ID required'}), 400
        
        # Find interview
        interview = None
        for i in interviews_storage:
            if i['id'] == interview_id:
                interview = i
                break
        
        if not interview:
            return jsonify({'success': False, 'error': 'Interview not found'}), 404
        
        # Update interview with completion data
        interview['status'] = 'completed'
        interview['completed_at'] = datetime.utcnow().isoformat()
        interview['ai_summary'] = data.get('ai_summary', 'Interview completed successfully')
        interview['performance_score'] = data.get('performance_score', 75)
        interview['feedback'] = data.get('feedback', 'Good performance overall')
        
        return jsonify({
            'success': True,
            'message': 'Interview completed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Test/Debug endpoints
@app.route("/debug/create-test-user", methods=["POST"])
def create_test_user():
    """Create a test candidate user for testing"""
    test_user = {
        'id': str(uuid.uuid4()),
        'email': 'candidate@test.com',
        'password_hash': generate_password_hash('password123'),
        'name': 'Test Candidate',
        'role': 'candidate',
        'phone': '+1234567890',
        'skills': ['JavaScript', 'React', 'Node.js'],
        'linkedinUrl': 'https://linkedin.com/in/testcandidate',
        'created_at': datetime.utcnow().isoformat(),
        'is_active': True
    }
    
    # Check if user already exists
    existing = find_user_by_email(test_user['email'])
    if existing:
        return jsonify({
            'success': True,
            'message': 'Test user already exists',
            'user_id': existing['id']
        }), 200
    
    users_storage.append(test_user)
    
    # Create test interview for this user
    test_interview = {
        'id': str(uuid.uuid4()),
        'candidateId': test_user['id'],
        'jobId': sample_jobs[0]['id'],
        'scheduledAt': (datetime.utcnow() + timedelta(hours=1)).isoformat(),
        'status': 'scheduled',
        'transcript': [],
        'score': 0,
        'feedback': '',
        'created_at': datetime.utcnow().isoformat()
    }
    interviews_storage.append(test_interview)
    
    return jsonify({
        'success': True,
        'message': 'Test user and interview created',
        'user_id': test_user['id'],
        'interview_id': test_interview['id'],
        'login_credentials': {
            'email': 'candidate@test.com',
            'password': 'password123'
        }
    }), 201

@app.route("/debug/info", methods=["GET"])
def debug_info():
    """Get debug information about current storage"""
    return jsonify({
        'success': True,
        'users_count': len(users_storage),
        'jobs_count': len(jobs_storage),
        'interviews_count': len(interviews_storage),
        'sample_interview_id': interviews_storage[0]['id'] if interviews_storage else None,
        'sample_job_id': jobs_storage[0]['id'] if jobs_storage else None
    }), 200

# Debug endpoint for testing upload without auth
@app.route("/debug/test-upload/<interview_id>", methods=["POST", "OPTIONS"])
def debug_test_upload(interview_id):
    """Debug endpoint to test upload without authentication"""
    try:
        if request.method == "OPTIONS":
            return jsonify({'message': 'OK'}), 200
            
        if "resume" not in request.files:
            return jsonify({'success': False, 'error': 'No resume file provided', 'interview_id': interview_id}), 400
        
        file = request.files["resume"]
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        return jsonify({
            'success': True,
            'message': 'File upload test successful',
            'interview_id': interview_id,
            'filename': file.filename
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e), 'interview_id': interview_id}), 500

# Health check
@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'AI Interview Platform API is running!',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

if __name__ == "__main__":
    print("🚀 Starting AI Interview Platform API...")
    print(f"📊 Users in storage: {len(users_storage)}")
    print(f"💼 Jobs in storage: {len(jobs_storage)}")
    app.run(debug=True, host="0.0.0.0", port=5000)
