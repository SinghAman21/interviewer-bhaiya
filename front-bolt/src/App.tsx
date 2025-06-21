import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Auth pages
import { Login } from './pages/Auth/Login';
import { Signup } from './pages/Auth/Signup';

// Candidate pages
import { Dashboard } from './pages/Candidate/Dashboard';
import { Profile } from './pages/Candidate/Profile';
import { Jobs } from './pages/Candidate/Jobs';
import { Interviews } from './pages/Candidate/Interviews';
import { InterviewRoom } from './pages/Candidate/InterviewRoom';
import { InterviewResults } from './pages/Candidate/InterviewResults';
import { Analytics } from './pages/Candidate/Analytics';

// Admin pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ManageJobs } from './pages/Admin/ManageJobs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected candidate routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="candidate">
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute requiredRole="candidate">
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/jobs" element={
            <ProtectedRoute requiredRole="candidate">
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/interviews" element={
            <ProtectedRoute requiredRole="candidate">
              <Layout>
                <Interviews />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/interview/:interviewId" element={
            <ProtectedRoute requiredRole="candidate">
              <InterviewRoom />
            </ProtectedRoute>
          } />
          
          <Route path="/interview/:interviewId/results" element={
            <ProtectedRoute requiredRole="candidate">
              <Layout>
                <InterviewResults />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute requiredRole="candidate">
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Protected admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/jobs" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <ManageJobs />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/candidates" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Candidates Management</h2>
                  <p className="text-gray-600 mt-2">This feature is coming soon!</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/interviews" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Interview Management</h2>
                  <p className="text-gray-600 mt-2">This feature is coming soon!</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/analytics" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Admin Analytics</h2>
                  <p className="text-gray-600 mt-2">This feature is coming soon!</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;