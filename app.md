Okay I want you to make the # AI-Powered Interview Platform

## 📋 Project Overview

This is a comprehensive AI-powered interview platform that allows candidates to practice technical interviews through multiple interfaces. The system uses AI (Google Gemini) to generate questions from resumes, conduct interviews, and provide detailed feedback and scoring.

## 🏗️ Project Structure

```
interviewer-bhaiya/
├── 📁 back/                          # Backend Flask API
│   ├── app.py                       # Main Flask API server
│   ├── main.py                      # Web-based interview interface
│   ├── main-cli.py                  # Command-line interview script
│   ├── conversation.py              # Voice-based interview system
│   ├── interviewer.py               # Core interview logic
│   ├── question_generator.py        # AI question generation
│   ├── requirements.txt             # Python dependencies
│   ├── Resume CreatED.pdf           # Sample resume
│   ├── questions.json               # Generated questions cache
│   ├── interview_results.json       # Interview results storage
│   ├── 📁 templates/                # HTML templates
│   │   ├── index.html              # Resume upload page
│   │   ├── interview.html          # Interview questions page
│   │   └── results.html            # Results display page
│   └── 📁 __pycache__/             # Python cache files
│
├── 📁 front/                        # Basic React Frontend
│   ├── src/
│   │   ├── App.tsx                 # Main App component
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   ├── 📁 components/
│   │   │   ├── InterviewRoom.tsx   # Interview interface
│   │   │   ├── ResumeInterviewStart.tsx
│   │   │   └── Video.tsx           # Video components
│   │   └── 📁 api/
│   │       └── start.ts            # API utilities
│   ├── package.json                # Dependencies
│   ├── vite.config.ts              # Vite configuration
│   └── tailwind.config.js          # Tailwind CSS config
│
├── 📁 front-bolt/                   # Advanced React Frontend
│   ├── src/
│   │   ├── App.tsx                 # Main application
│   │   ├── main.tsx                # Entry point
│   │   ├── 📁 components/
│   │   │   ├── Layout.tsx          # Main layout
│   │   │   ├── LoadingSpinner.tsx  # Loading component
│   │   │   ├── ProtectedRoute.tsx  # Route protection
│   │   │   └── 📁 ui/              # UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       └── Modal.tsx
│   │   ├── 📁 contexts/
│   │   │   └── AuthContext.tsx     # Authentication context
│   │   ├── 📁 pages/
│   │   │   ├── 📁 Admin/           # Admin panel pages
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   └── ManageJobs.tsx
│   │   │   ├── 📁 Auth/            # Authentication pages
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Signup.tsx
│   │   │   └── 📁 Candidate/       # Candidate pages
│   │   │       ├── Analytics.tsx   # Performance analytics
│   │   │       ├── Dashboard.tsx   # Main dashboard
│   │   │       ├── InterviewResults.tsx # Results display
│   │   │       ├── InterviewRoom.tsx    # Live interview
│   │   │       ├── Interviews.tsx  # Interview management
│   │   │       ├── Jobs.tsx        # Job listings
│   │   │       └── Profile.tsx     # User profile
│   │   ├── 📁 services/
│   │   │   └── mockApi.ts          # Mock API services
│   │   └── 📁 types/
│   │       └── index.ts            # TypeScript definitions
│   ├── package.json                # Dependencies
│   └── vite.config.ts              # Vite configuration
│
├── README.md                        # Basic project info
├── start.sh                        # Startup script
└── app.md                          # This documentation file
```

## 🎯 Features

### Core Features
- **Resume Analysis**: AI-powered question generation from PDF/DOCX resumes
- **Multiple Interview Modes**:
  - Web-based text interviews
  - Voice-based interviews with speech recognition
  - Real-time chat interviews
- **AI Evaluation**: Automatic scoring and feedback using Google Gemini
- **Performance Analytics**: Detailed performance tracking and insights

### Advanced Features (front-bolt)
- **User Authentication**: Role-based access (Candidate/Admin)
- **Job Management**: Browse and apply for positions
- **Interview Scheduling**: Schedule and manage interviews
- **Real-time Chat**: Live AI interview sessions
- **Performance Dashboard**: Comprehensive analytics
- **Interview History**: Track all completed interviews
- **Results Analysis**: Detailed feedback and scoring

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask (Python)
- **AI Model**: Google Gemini 1.5 Flash
- **File Processing**: pdfplumber, python-docx
- **Voice Processing**: faster-whisper, pyttsx3, sounddevice
- **Audio Analysis**: pyAudioAnalysis, librosa
- **Environment**: python-dotenv

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **State Management**: React Context API

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- pnpm package manager

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd back
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # or
   source venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create a `.env` file in the `back` directory:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

5. **Create necessary directories**:
   ```bash
   mkdir uploads
   mkdir audio_input
   ```

### Frontend Setup

#### Basic Frontend (front)
```bash
cd front
pnpm install
```

#### Advanced Frontend (front-bolt)
```bash
cd front-bolt
pnpm install
```

## 🚀 Running the Application

### Method 1: Using the Startup Script
```bash
# Make the script executable (macOS/Linux)
chmod +x start.sh

# Run the script
./start.sh
```

### Method 2: Manual Start

#### Start Backend
```bash
cd back
python app.py  # For API server
# or
python main.py  # For web interface
# or
python main-cli.py  # For CLI interface
# or
python conversation.py  # For voice interview
```

#### Start Frontend
```bash
# Basic frontend
cd front
pnpm run dev

# Advanced frontend
cd front-bolt
pnpm run dev
```

### Method 3: VS Code Tasks
Use the configured VS Code tasks:
- **"Start Frontend"**: Runs the React development server
- **"Start Backend"**: Runs the Flask API server

## 🌐 Access Points

- **Basic Frontend**: http://localhost:5173
- **Advanced Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Backend Web Interface**: http://localhost:5000

## 📚 API Endpoints

### Resume & Questions
- `GET /` - Health check
- `POST /uploadcv` - Upload resume and generate questions
- `POST /submitqna` - Submit answers for evaluation
- `POST /interview-summary` - Get interview summary

### Frontend Integration
The frontends communicate with the backend API for:
- Resume processing
- Question generation
- Answer evaluation
- Interview management

## 🎮 Usage Guide

### For Basic Text Interview

1. **Upload Resume**:
   - Go to http://localhost:5000
   - Upload your PDF/DOCX resume
   - System generates interview questions

2. **Answer Questions**:
   - Answer each generated question
   - Submit responses for AI evaluation

3. **View Results**:
   - Get scored feedback
   - View performance analytics

### For Advanced Platform (front-bolt)

1. **Registration/Login**:
   - Create account or login
   - Choose role (Candidate/Admin)

2. **Browse Jobs**:
   - View available positions
   - Schedule interviews

3. **Take Interview**:
   - Join scheduled interview
   - Chat with AI interviewer
   - Real-time conversation

4. **View Analytics**:
   - Performance dashboard
   - Interview history
   - Detailed feedback

### For Voice Interview

1. **Run CLI Script**:
   ```bash
   cd back
   python conversation.py
   ```

2. **Follow Prompts**:
   - Speak your answers when prompted
   - System records and transcribes
   - Get real-time feedback

## 🔧 Configuration

### Backend Configuration
- **API Keys**: Set GEMINI_API_KEY in `.env`
- **CORS**: Configured for localhost:5173
- **File Uploads**: Stored in `uploads/` directory
- **Audio Files**: Stored in `audio_input/` directory

### Frontend Configuration
- **API Base URL**: Configured for localhost:5000
- **Routing**: React Router for navigation
- **Authentication**: Context-based state management

## 🐛 Troubleshooting

### Common Issues

1. **GEMINI_API_KEY not found**:
   - Ensure `.env` file exists in `back/` directory
   - Verify API key is correct

2. **Module not found errors**:
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

3. **Frontend build errors**:
   - Ensure Node.js 16+ is installed
   - Run `pnpm install` in frontend directory

4. **CORS errors**:
   - Check backend CORS configuration
   - Ensure frontend runs on localhost:5173

5. **Audio recording issues**:
   - Check microphone permissions
   - Ensure audio dependencies are installed

### Performance Optimization

- **Backend**: Use production WSGI server (Gunicorn)
- **Frontend**: Build for production (`pnpm run build`)
- **Database**: Consider adding persistent storage
- **Caching**: Implement Redis for question caching

## 🚀 Deployment

### Backend Deployment
```bash
# Install production server
pip install gunicorn

# Run production server
gunicorn -w 4 app:app
```

### Frontend Deployment
```bash
# Build for production
pnpm run build

# Serve static files
# Deploy to Netlify, Vercel, or similar
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is for educational and development purposes.

---

**Note**: This is a comprehensive AI-powered interview platform with multiple interfaces. Choose the appropriate interface based on your needs:
- Use `back/app.py` + `front-bolt/` for the full-featured platform
- Use `back/main.py` for simple web interface
- Use `back/conversation.py` for voice-based interviews
- Use `back/main-cli.py` for command-line interface
