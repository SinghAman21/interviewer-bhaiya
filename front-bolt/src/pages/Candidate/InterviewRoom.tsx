import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { 
  Upload, Mic, MicOff, Video, VideoOff, Phone, Play, Pause, 
  Clock, User, FileText, Camera, Send, SkipForward 
} from 'lucide-react';
import { Interview, Job } from '../../types';

type InterviewStage = 'loading' | 'upload-resume' | 'camera-setup' | 'in-progress' | 'completed';

export const InterviewRoom: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Core states
  const [interview, setInterview] = useState<Interview | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [stage, setStage] = useState<InterviewStage>('loading');
  
  // Resume upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  
  // Interview states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  
  // Audio/Video states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  
  // Timer
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);
  useEffect(() => {
    let timer: number;
    if (startTime && stage === 'in-progress') {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, stage]);
  const fetchInterview = async () => {
    if (!interviewId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.interview) {
        setInterview(result.interview);
        
        // Fetch job details
        const jobResponse = await fetch(`http://localhost:5000/jobs/${result.interview.jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        const jobResult = await jobResponse.json();
        if (jobResult.success && jobResult.job) {
          setJob(jobResult.job);
        }
        
        // Check interview status
        if (result.interview.status === 'scheduled') {
          setStage('upload-resume');
        } else if (result.interview.status === 'resume_uploaded') {
          setStage('camera-setup');
          setQuestions(result.interview.questions || []);
        } else if (result.interview.status === 'in_progress') {
          setStage('in-progress');
          setQuestions(result.interview.questions || []);
          setCurrentQuestionIndex(result.interview.current_question_index || 0);
          setStartTime(new Date(result.interview.started_at));
        } else if (result.interview.status === 'completed') {
          setStage('completed');
        }
      } else {
        console.error('Failed to fetch interview:', result.error);
        setStage('completed'); // Fallback to avoid infinite loading
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      setStage('completed'); // Fallback to avoid infinite loading
    }
  };
  const handleResumeUpload = async () => {
    if (!resumeFile || !interviewId) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      
      const response = await fetch(`http://localhost:5000/interviews/${interviewId}/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setQuestions(result.questions);
        setStage('camera-setup');
        await fetchInterview(); // Refresh interview data
      } else {
        alert('Failed to upload resume: ' + result.error);
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const setupCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const startInterview = async () => {
    if (!interviewId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/interviews/${interviewId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStage('in-progress');
        setCurrentQuestionIndex(0);
        setStartTime(new Date());
        await speakQuestion(questions[0]);
      } else {
        alert('Failed to start interview: ' + result.error);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview');
    }
  };

  const speakQuestion = async (question: string) => {
    setIsTTSPlaying(true);
    try {
      // Use Web Speech API for TTS
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.onend = () => setIsTTSPlaying(false);
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with TTS:', error);
      setIsTTSPlaying(false);
    }
  };

  const startRecording = async () => {
    if (!stream) return;
    
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioAnswer(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const processAudioAnswer = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.wav');
      
      const response = await fetch(`http://localhost:5000/interviews/${interviewId}/stt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentAnswer(result.transcription);
      } else {
        // Fallback to text input
        const transcription = prompt('STT failed. Please type your answer:') || '';
        setCurrentAnswer(transcription);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      // Fallback to text input
      const transcription = prompt('Please type your answer (STT error):') || '';
      setCurrentAnswer(transcription);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim() || !interviewId) return;
    
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    
    try {
      const response = await fetch(`http://localhost:5000/interviews/${interviewId}/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ answer: currentAnswer })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.completed) {
          setStage('completed');
        } else {
          setCurrentQuestionIndex(result.question_index);
          await speakQuestion(result.current_question);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/candidate/interviews');
  };

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {job?.title || 'Interview'}
                </h1>
                <p className="text-sm text-gray-600">{job?.company} • AI Interview</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {stage === 'in-progress' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(elapsedTime)}</span>
                </div>
              )}
              <Button 
                variant="outline"
                onClick={endInterview}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Phone className="w-4 h-4 mr-2" />
                End Interview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Resume Upload Stage */}
        {stage === 'upload-resume' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
              <p className="text-gray-600 mb-6">
                Please upload your resume so I can prepare personalized questions for your interview.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-lg font-medium text-gray-900">
                    {resumeFile ? resumeFile.name : 'Click to upload resume'}
                  </span>
                  <span className="text-sm text-gray-500">PDF, DOC, or DOCX files</span>
                </label>
              </div>
              
              <Button
                onClick={handleResumeUpload}
                disabled={!resumeFile || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload Resume & Generate Questions'}
              </Button>
            </div>
          </div>
        )}

        {/* Camera Setup Stage */}
        {stage === 'camera-setup' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center mb-8">
                <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Camera & Audio Setup</h2>
                <p className="text-gray-600">
                  Let's test your camera and microphone before starting the interview.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Video Preview */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Camera Preview</h3>
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!stream && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Camera not started</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4 mt-4">                    <Button
                      onClick={setupCamera}
                      disabled={!!stream}
                      variant={stream ? "outline" : "primary"}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {stream ? 'Camera Active' : 'Start Camera'}
                    </Button>
                  </div>
                </div>
                
                {/* Interview Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Interview Details</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Questions Generated</h4>
                      <p className="text-blue-700">
                        {questions.length} personalized questions based on your resume and the job requirements.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Interview Features</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• AI will speak questions using text-to-speech</li>
                        <li>• You can answer using voice (speech-to-text)</li>
                        <li>• Video recording for analysis</li>
                        <li>• Real-time performance feedback</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Button
                    onClick={startInterview}
                    disabled={!stream}
                    className="w-full mt-6"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Interview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview In Progress */}
        {stage === 'in-progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-4">Your Video</h3>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted={isMuted}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Main Interview Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Question Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speakQuestion(questions[currentQuestionIndex])}
                      disabled={isTTSPlaying}
                    >
                      {isTTSPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isTTSPlaying ? 'Speaking...' : 'Repeat Question'}
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-blue-900 text-lg">
                      {questions[currentQuestionIndex]}
                    </p>
                  </div>
                </div>
                
                {/* Answer Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "danger" : "primary"}
                      size="lg"
                    >
                      {isRecording ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                      {isRecording ? 'Stop Recording' : 'Record Answer'}
                    </Button>
                    
                    {isRecording && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Recording...</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer (You can also type here)
                    </label>
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Speak your answer or type it here..."
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      onClick={submitAnswer}
                      disabled={!currentAnswer.trim()}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Answer
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={submitAnswer}
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip Question
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Completed */}
        {stage === 'completed' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Completed!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for completing the interview. Your responses have been recorded and will be analyzed.
              </p>
              
              <div className="flex space-x-4 justify-center">
                <Button
                  onClick={() => navigate('/candidate/interviews')}
                  variant="outline"
                >
                  Back to Interviews
                </Button>
                <Button
                  onClick={() => navigate(`/candidate/interview-results/${interviewId}`)}
                >
                  View Results
                </Button>
              </div>            </div>
          </div>
        )}
      </div>
    </div>
  );
};