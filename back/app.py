from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from question_generator import extract_resume_text, generate_questions_from_resume
from interviewer import evaluate_answers
from simple_database import User, Job, Interview, Question, Activity, prepare_user_response, json_serializer, init_default_admin, init_sample_data
import os
import json
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# CORS Configuration
CORS(app,
     resources={r"/*": {
         "origins": [
             "http://localhost:5173",  # React app
             "http://localhost:5174",  # React app (alternative port)
             "http://127.0.0.1:5173",  # React app
             "http://127.0.0.1:5174",  # React app (alternative port)
             "https://your-production-domain.com"  # Replace with your production domain
         ],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "supports_credentials": True,
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "max_age": 3600,
     }}
)

# Initialize database
init_default_admin()
init_sample_data()

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
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check if user already exists
        existing_user = User.find_by_email(data['email'])
        if existing_user:
            return jsonify({"error": "User already exists"}), 409
        
        # Create user
        user_data = {
            'email': data['email'],
            'name': data['name'],
            'role': data['role'],
            'password': data['password'],
            'phone': data.get('phone'),
            'skills': data.get('skills', []),
            'linkedinUrl': data.get('linkedinUrl')
        }
        
        user = User.create_user(user_data)
        
        # Log activity
        Activity.log_activity(
            str(user['_id']), 
            'user_registration', 
            f"User registered with role: {user['role']}"
        )
        
        # Create access token
        access_token = create_access_token(identity=str(user['_id']))
        
        return jsonify({
            "success": True,
            "user": prepare_user_response(user),
            "access_token": access_token
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/login", methods=["POST"])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400
        
        # Find user
        user = User.find_by_email(data['email'])
        if not user or not User.verify_password(user, data['password']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Check if role matches (optional)
        if 'role' in data and user['role'] != data['role']:
            return jsonify({"error": "Invalid role"}), 401
        
        # Log activity
        Activity.log_activity(
            str(user['_id']), 
            'user_login', 
            f"User logged in as {user['role']}"
        )
        
        # Create access token
        access_token = create_access_token(identity=str(user['_id']))
        
        return jsonify({
            "success": True,
            "user": prepare_user_response(user),
            "access_token": access_token
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "success": True,
            "user": prepare_user_response(user)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Remove sensitive fields
        data.pop('password', None)
        data.pop('role', None)
        data.pop('_id', None)
        
        # Update user
        User.update_user(user_id, data)
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'profile_update', 
            "User profile updated"
        )
        
        # Get updated user
        user = User.find_by_id(user_id)
        
        return jsonify({
            "success": True,
            "user": prepare_user_response(user)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Job Management Routes
@app.route("/jobs", methods=["GET"])
def get_jobs():
    """Get all jobs"""
    try:
        jobs = Job.get_all_jobs()
        jobs_data = []
        
        for job in jobs:
            job_dict = dict(job)
            job_dict['id'] = str(job_dict.pop('_id'))
            job_dict['createdAt'] = job_dict.pop('created_at', datetime.utcnow())
            jobs_data.append(job_dict)
        
        return jsonify({
            "success": True,
            "jobs": jobs_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/jobs", methods=["POST"])
@jwt_required()
def create_job():
    """Create new job (Admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'company', 'description', 'techStack', 'requirements', 'location', 'type']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        job_data = {
            'title': data['title'],
            'company': data['company'],
            'description': data['description'],
            'techStack': data['techStack'],
            'requirements': data['requirements'],
            'location': data['location'],
            'type': data['type'],
            'salaryRange': data.get('salaryRange'),
            'createdBy': user_id
        }
        
        job = Job.create_job(job_data)
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'job_creation', 
            f"Created job: {job['title']}"
        )
        
        job['id'] = str(job.pop('_id'))
        job['createdAt'] = job.pop('created_at')
        
        return jsonify({
            "success": True,
            "job": job
        }, 201)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/jobs/<job_id>", methods=["GET"])
def get_job(job_id):
    """Get job by ID"""
    try:
        job = Job.find_by_id(job_id)
        
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        job_dict = dict(job)
        job_dict['id'] = str(job_dict.pop('_id'))
        job_dict['createdAt'] = job_dict.pop('created_at', datetime.utcnow())
        
        return jsonify({
            "success": True,
            "job": job_dict
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Interview Management Routes
@app.route("/interviews", methods=["GET"])
@jwt_required()
def get_interviews():
    """Get user's interviews"""
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        print(f"DEBUG: Getting interviews for user {user_id}, role: {user['role']}")
        
        if user['role'] == 'admin':
            interviews = Interview.get_all_interviews()
        else:
            interviews = Interview.get_by_candidate(user_id)
        
        print(f"DEBUG: Found {len(interviews)} interviews")
        
        interviews_data = []
        for interview in interviews:
            interview_dict = dict(interview)
            # Convert field names to match frontend expectations
            interview_dict['id'] = str(interview_dict.pop('_id'))
            interview_dict['jobId'] = interview_dict.pop('job_id') 
            interview_dict['candidateId'] = interview_dict.pop('candidate_id')
            interview_dict['scheduledAt'] = interview_dict.pop('scheduled_at')
            interview_dict['createdAt'] = interview_dict.pop('created_at', datetime.utcnow())
            interviews_data.append(interview_dict)
        
        print(f"DEBUG: Returning interviews: {interviews_data}")
        
        return jsonify({
            "success": True,
            "interviews": interviews_data
        }), 200
        
    except Exception as e:
        print(f"ERROR: Failed to get interviews: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/interviews", methods=["POST"])
@jwt_required()
def schedule_interview():
    """Schedule new interview"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"DEBUG: Scheduling interview for user {user_id} with data: {data}")
        
        # Validate required fields
        required_fields = ['job_id', 'scheduled_at']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        interview_data = {
            'candidate_id': user_id,
            'job_id': data['job_id'],
            'scheduled_at': datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00')),
            'status': 'scheduled'
        }
        
        interview = Interview.create_interview(interview_data)
        print(f"DEBUG: Created interview: {interview}")
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'interview_scheduled', 
            f"Scheduled interview for job: {data['job_id']}"
        )
        
        # Prepare response with correct field names for frontend
        interview_response = dict(interview)
        interview_response['id'] = str(interview_response.pop('_id'))
        interview_response['jobId'] = interview_response.pop('job_id')
        interview_response['candidateId'] = interview_response.pop('candidate_id')
        interview_response['scheduledAt'] = interview_response.pop('scheduled_at')
        interview_response['createdAt'] = interview_response.pop('created_at')
        
        return jsonify({
            "success": True,
            "interview": interview_response
        }), 201
        
    except Exception as e:
        print(f"ERROR: Failed to schedule interview: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/interviews/<interview_id>", methods=["GET"])
@jwt_required()
def get_interview(interview_id):
    """Get interview by ID"""
    try:
        user_id = get_jwt_identity()
        interview = Interview.find_by_id(interview_id)
        
        if not interview:
            return jsonify({"error": "Interview not found"}), 404
        
        # Check if user has access to this interview
        user = User.find_by_id(user_id)
        if user['role'] != 'admin' and interview['candidate_id'] != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        interview_dict = dict(interview)
        # Convert field names to match frontend expectations
        interview_dict['id'] = str(interview_dict.pop('_id'))
        interview_dict['jobId'] = interview_dict.pop('job_id')
        interview_dict['candidateId'] = interview_dict.pop('candidate_id')
        interview_dict['scheduledAt'] = interview_dict.pop('scheduled_at')
        interview_dict['createdAt'] = interview_dict.pop('created_at', datetime.utcnow())
        
        return jsonify({
            "success": True,
            "interview": interview_dict
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/interviews/<interview_id>/messages", methods=["POST"])
@jwt_required()
def add_interview_message():
    """Add message to interview transcript"""
    try:
        user_id = get_jwt_identity()
        interview_id = request.view_args['interview_id']
        data = request.get_json()
        
        # Validate required fields
        if 'message' not in data or 'sender' not in data:
            return jsonify({"error": "Message and sender required"}), 400
        
        # Create message
        message_data = {
            'id': str(uuid.uuid4()),
            'sender': data['sender'],
            'message': data['message'],
            'timestamp': datetime.utcnow()
        }
        
        # Add message to interview
        Interview.add_message(interview_id, message_data)
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'interview_message', 
            f"Added message to interview: {interview_id}"
        )
        
        return jsonify({
            "success": True,
            "message": message_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/interviews/<interview_id>/complete", methods=["POST"])
@jwt_required()
def complete_interview():
    """Complete interview with results"""
    try:
        user_id = get_jwt_identity()
        interview_id = request.view_args['interview_id']
        data = request.get_json()
        
        update_data = {
            'status': 'completed',
            'ai_summary': data.get('ai_summary'),
            'performance_score': data.get('performance_score'),
            'feedback': data.get('feedback')
        }
        
        Interview.update_interview(interview_id, update_data)
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'interview_completed', 
            f"Completed interview: {interview_id}"
        )
        
        return jsonify({
            "success": True,
            "message": "Interview completed successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# User Activity Routes
@app.route("/activities", methods=["GET"])
@jwt_required()
def get_activities():
    """Get user activities"""
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if user['role'] == 'admin':
            activities = Activity.get_all_activities()
        else:
            activities = Activity.get_user_activities(user_id)
        
        activities_data = []
        for activity in activities:
            activity_dict = dict(activity)
            activity_dict['id'] = str(activity_dict.pop('_id'))
            activities_data.append(activity_dict)
        
        return jsonify({
            "success": True,
            "activities": activities_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "AI Interview Platform API is running"}), 200

@app.route("/uploadcv", methods=["POST"])
@jwt_required()
def upload_resume():
    """Upload resume and generate questions"""
    try:
        user_id = get_jwt_identity()
        
        if "resume" not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files["resume"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Save file
        filename = f"{user_id}_{file.filename}"
        path = os.path.join("uploads", filename)
        file.save(path)
        
        # Extract text and generate questions
        text = extract_resume_text(path)
        questions = generate_questions_from_resume(text)
        
        # Save questions to database
        Question.save_questions(path, questions)
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'resume_upload', 
            f"Uploaded resume and generated {len(questions)} questions"
        )
        
        return jsonify({
            "success": True,
            "questions": questions,
            "resume_path": path
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/submitqna", methods=["POST"])
@jwt_required()
def submit_answers():
    """Submit interview answers for evaluation"""
    try:
        user_id = get_jwt_identity()
        data = request.json  # [{question, answer, type}, ...]
        
        if not data or not isinstance(data, list):
            return jsonify({"error": "Invalid data format"}), 400
        
        # Evaluate answers
        result = evaluate_answers(data)
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'answers_submitted', 
            f"Submitted {len(data)} answers for evaluation"
        )
        
        return jsonify({
            "success": True,
            "results": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/interview-summary", methods=["POST"])
@jwt_required()
def interview_summary():
    """Get interview summary"""
    try:
        user_id = get_jwt_identity()
        data = request.json  # {performanceScore, aiSummary}
        
        score = data.get("performanceScore", 0)
        score_label = getScoreLabel(score)
        summary = data.get("aiSummary", "")
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'interview_summary', 
            f"Generated interview summary with score: {score}"
        )
        
        return jsonify({
            "success": True,
            "score_label": score_label, 
            "summary": summary,
            "score": score
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def getScoreLabel(score):
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 50:
        return "Average"
    else:
        return "Poor"

# Interview Flow Routes - Stage 3 Implementation
@app.route("/interviews/<interview_id>/upload-resume", methods=["POST"])
@jwt_required()
def upload_resume_for_interview():
    """Upload resume for a specific interview and generate questions"""
    try:
        user_id = get_jwt_identity()
        interview_id = request.view_args['interview_id']
        
        # Verify interview exists and user has access
        interview = Interview.find_by_id(interview_id)
        if not interview:
            return jsonify({"error": "Interview not found"}), 404
        
        user = User.find_by_id(user_id)
        if user['role'] != 'admin' and interview['candidate_id'] != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        if "resume" not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files["resume"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Save file
        filename = f"{interview_id}_{user_id}_{file.filename}"
        resume_path = os.path.join("uploads", filename)
        file.save(resume_path)
        
        # Extract text from resume
        resume_text = extract_resume_text(resume_path)
        
        # Get job details for context
        job = Job.find_by_id(interview['job_id'])
        job_context = f"""
        Job Title: {job['title']}
        Company: {job['company']}
        Job Description: {job['description']}
        Tech Stack: {', '.join(job['techStack'])}
        Requirements: {', '.join(job['requirements'])}
        """
        
        # Generate questions based on resume and job
        questions = generate_questions_from_resume(resume_text, job_context)
        
        # Update interview with resume and questions
        Interview.update_interview(interview_id, {
            'resume_path': resume_path,
            'resume_text': resume_text,
            'questions': questions,
            'current_question_index': 0,
            'status': 'resume_uploaded'
        })
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'interview_resume_upload', 
            f"Uploaded resume for interview: {interview_id}"
        )
        
        return jsonify({
            "success": True,
            "questions": questions,
            "total_questions": len(questions),
            "message": "Resume uploaded and questions generated successfully"
        }), 200
        
    except Exception as e:
        print(f"ERROR: Failed to upload resume: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/interviews/<interview_id>/start", methods=["POST"])
@jwt_required()
def start_interview():
    """Start the interview with camera and audio"""
    try:
        user_id = get_jwt_identity()
        interview_id = request.view_args['interview_id']
        
        # Verify interview exists and user has access
        interview = Interview.find_by_id(interview_id)
        if not interview:
            return jsonify({"error": "Interview not found"}), 404
        
        user = User.find_by_id(user_id)
        if user['role'] != 'admin' and interview['candidate_id'] != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        # Check if resume is uploaded
        if 'questions' not in interview:
            return jsonify({"error": "Please upload resume first"}), 400
        
        # Update interview status and start time
        Interview.update_interview(interview_id, {
            'status': 'in_progress',
            'started_at': datetime.utcnow(),
            'current_question_index': 0
        })
        
        # Get the first question
        current_question = interview['questions'][0] if interview['questions'] else None
        
        # Log activity
        Activity.log_activity(
            user_id, 
            'interview_started', 
            f"Started interview: {interview_id}"
        )
        
        return jsonify({
            "success": True,
            "message": "Interview started successfully",
            "current_question": current_question,
            "question_index": 0,
            "total_questions": len(interview['questions'])
        }), 200
        
    except Exception as e:
        print(f"ERROR: Failed to start interview: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/interviews/<interview_id>/next-question", methods=["POST"])
@jwt_required()
def next_question():
    """Get next question in the interview"""
    try:
        user_id = get_jwt_identity()
        interview_id = request.view_args['interview_id']
        data = request.get_json()
        
        # Verify interview exists and user has access
        interview = Interview.find_by_id(interview_id)
        if not interview:
            return jsonify({"error": "Interview not found"}), 404
        
        # Save the answer if provided
        if 'answer' in data:
            answer_data = {
                'question_index': interview.get('current_question_index', 0),
                'question': interview['questions'][interview.get('current_question_index', 0)],
                'answer': data['answer'],
                'timestamp': datetime.utcnow()
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
            Interview.update_interview(interview_id, {
                'status': 'completed',
                'completed_at': datetime.utcnow(),
                'current_question_index': next_index,
                'answers': interview.get('answers', [])
            })
            
            return jsonify({
                "success": True,
                "completed": True,
                "message": "Interview completed successfully"
            }), 200
        else:
            # Get next question
            next_question = interview['questions'][next_index]
            Interview.update_interview(interview_id, {
                'current_question_index': next_index,
                'answers': interview.get('answers', [])
            })
            
            return jsonify({
                "success": True,
                "completed": False,
                "current_question": next_question,
                "question_index": next_index,
                "total_questions": len(interview['questions'])
            }), 200
        
    except Exception as e:
        print(f"ERROR: Failed to get next question: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/interviews/<interview_id>/tts", methods=["POST"])
@jwt_required()
def text_to_speech():
    """Convert text to speech for interview questions"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # For now, return success - in production, implement actual TTS
        return jsonify({
            "success": True,
            "message": "TTS ready",
            "audio_url": f"/audio/tts_{uuid.uuid4().hex}.mp3"  # Mock URL
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/interviews/<interview_id>/stt", methods=["POST"])
@jwt_required()
def speech_to_text():
    """Convert speech to text for interview answers"""
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files["audio"]
        if audio_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Create audio directory if it doesn't exist
        os.makedirs("audio_input", exist_ok=True)
        
        # Save audio file
        filename = f"stt_{uuid.uuid4().hex}.wav"
        audio_path = os.path.join("audio_input", filename)
        audio_file.save(audio_path)
        
        # For now, return mock transcription - in production, implement actual STT
        mock_transcription = "This is a mock transcription of the audio response."
        
        return jsonify({
            "success": True,
            "transcription": mock_transcription
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
