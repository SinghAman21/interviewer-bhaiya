import React, { useRef, useState } from 'react';

interface Question {
  id: string;
  text: string;
}

interface InterviewResult {
  score: number;
  feedback: string;
}

const InterviewRoom: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Start camera on mount
  React.useEffect(() => {
    if (videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => setError('Unable to access camera.'));
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle resume upload
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setError('');
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  // Send resume to backend and get questions
  const startInterview = async () => {
    if (!resumeFile) {
      setError('Please upload your resume.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await fetch('http://localhost:5000/uploadcv', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to start interview.');
      const data = await res.json();
      setQuestions(data.questions);
      setIsInterviewStarted(true);
    } catch (err) {
      setError('Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  // Handle answer input
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = e.target.value;
    setAnswers(newAnswers);
  };

  // Next question
  const handleNext = () => {
    if (!answers[currentQuestion] || answers[currentQuestion].trim() === '') {
      setError('Please answer the question.');
      return;
    }
    setError('');
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitInterview();
    }
  };

  // Submit answers to backend
  const submitInterview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/interview/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions }),
      });
      if (!res.ok) throw new Error('Failed to submit interview.');
      const data = await res.json();
      setResult(data.result);
      setIsInterviewFinished(true);
    } catch (err) {
      setError('Failed to submit interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Interview Room</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded shadow" />
        </div>
        <div className="flex-1 space-y-4">
          {!isInterviewStarted && !isInterviewFinished && (
            <>
              <label className="block font-medium mb-2">Upload Resume (PDF)</label>
              <input type="file" accept="application/pdf" onChange={handleResumeChange} />
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                onClick={startInterview}
                disabled={loading || !resumeFile}
              >
                {loading ? 'Starting...' : 'Start Interview'}
              </button>
            </>
          )}
          {isInterviewStarted && !isInterviewFinished && questions.length > 0 && (
            <div>
              <div className="mb-4">
                <div className="font-semibold">Question {currentQuestion + 1} of {questions.length}</div>
                <div className="mt-2 text-gray-800">{questions[currentQuestion].text}</div>
              </div>
              <textarea
                className="w-full border rounded p-2"
                rows={4}
                value={answers[currentQuestion] || ''}
                onChange={handleAnswerChange}
                placeholder="Type your answer here..."
                disabled={loading}
              />
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                onClick={handleNext}
                disabled={loading}
              >
                {currentQuestion < questions.length - 1 ? 'Next' : 'Submit Interview'}
              </button>
            </div>
          )}
          {isInterviewFinished && result && (
            <div className="bg-green-100 p-4 rounded">
              <div className="font-bold text-lg mb-2">Interview Complete!</div>
              <div className="mb-1">Score: <span className="font-semibold">{result.score}</span></div>
              <div>Feedback: {result.feedback}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
