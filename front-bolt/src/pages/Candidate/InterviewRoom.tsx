import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockInterviewService, mockJobService } from '../../services/mockApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Send, Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Clock, User, Notebook as Robot } from 'lucide-react';
import { Interview, Job, ChatMessage } from '../../types';

export const InterviewRoom: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInterview = async () => {
      if (!interviewId) return;
      
      try {
        const interviewResponse = await mockInterviewService.getInterviewById(interviewId);
        if (interviewResponse.success && interviewResponse.interview) {
          setInterview(interviewResponse.interview);
          setMessages(interviewResponse.interview.transcript);
          
          const jobResponse = await mockJobService.getJobById(interviewResponse.interview.jobId);
          if (jobResponse.success && jobResponse.job) {
            setJob(jobResponse.job);
          }
          
          setStartTime(new Date());
        }
      } catch (error) {
        console.error('Error fetching interview:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  // Timer effect
  useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when AI stops typing
  useEffect(() => {
    if (!isAITyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAITyping]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || !interview || isSending) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsSending(true);

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      id: `msg${Date.now()}`,
      sender: 'candidate',
      message: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    // Add message to interview
    await mockInterviewService.addChatMessage(interview.id, {
      sender: 'candidate',
      message: userMessage,
    });

    // Simulate AI typing
    setIsAITyping(true);

    try {
      // Get AI response
      const aiResponse = await mockInterviewService.generateAIResponse(userMessage, messages);
      
      if (aiResponse.success) {
        const aiMessage: ChatMessage = {
          id: `msg${Date.now() + 1}`,
          sender: 'ai',
          message: aiResponse.message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);

        // Add AI message to interview
        await mockInterviewService.addChatMessage(interview.id, {
          sender: 'ai',
          message: aiResponse.message,
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsAITyping(false);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endInterview = async () => {
    if (!interview) return;

    try {
      // Generate mock AI summary and scoring
      const aiSummary = "The candidate demonstrated strong technical knowledge and problem-solving abilities. They showed excellent communication skills and provided detailed, thoughtful responses to technical questions.";
      const performanceScore = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
      const feedback = "Great performance! The candidate shows strong potential and would be a valuable addition to the team. Recommended for next round.";

      await mockInterviewService.completeInterview(
        interview.id,
        aiSummary,
        performanceScore,
        feedback
      );

      navigate(`/interview/${interview.id}/results`);
    } catch (error) {
      console.error('Error ending interview:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Connecting to interview..." />
      </div>
    );
  }

  if (!interview || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Interview not found</h2>
          <p className="text-gray-600 mt-2">This interview may have been cancelled or does not exist.</p>
          <Button onClick={() => navigate('/interviews')} className="mt-4">
            Back to Interviews
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-600">{job.company} • AI Interview</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-full ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200 transition-colors`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-2 rounded-full ${isVideoOff ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200 transition-colors`}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
            
            <Button variant="danger" onClick={endInterview}>
              <Phone className="w-4 h-4 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          // here the video of the user shall be displayed
          {/* {messages.length === 0 && (
            <div className="text-center py-8">
              <Robot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Welcome to your AI Interview!</h3>
              <p className="text-gray-600 mt-2">The AI interviewer will start the conversation. Be yourself and answer thoughtfully.</p>
            </div>
          )} */}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${message.sender === 'candidate' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'candidate' 
                  ? 'bg-blue-500' 
                  : 'bg-purple-500'
                }`}>
                  {message.sender === 'candidate' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Robot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className={`rounded-lg px-4 py-3 ${message.sender === 'candidate'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'candidate' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isAITyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <Robot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                disabled={isSending || isAITyping}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isSending || isAITyping}
              className="px-6 py-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};