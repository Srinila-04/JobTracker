import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Layouts / Shared
import Navbar from './components/shared/Navbar';

import SeekerDashboard from "./pages/JobSeeker/SeekerDashboard";
import SeekerFindJobs from "./pages/JobSeeker/SeekerFindJobs";
import SeekerJobDetails from "./pages/JobSeeker/SeekerJobDetails";
import SeekerSavedJobs from "./pages/JobSeeker/SeekerSavedJobs";
import SeekerApplications from "./pages/JobSeeker/SeekerApplications";
import SeekerProfile from "./pages/JobSeeker/SeekerProfile";

import EmployerDashboard from "./pages/Employer/EmployerDashboard";
import EmployerManageJobs from "./pages/Employer/EmployerManageJobs";
import EmployerPostJob from "./pages/Employer/EmployerPostJob";
import EmployerEditJob from "./pages/Employer/EmployerEditJob";
import EmployerApplicants from "./pages/Employer/EmployerApplicants";
import EmployerProfile from "./pages/Employer/EmployerProfile";

import Login from "./pages/shared/Login";
import Register from "./pages/shared/Register";
import Messages from "./pages/shared/Messages";

// Auth Guard Components
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const JobSeekerRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.user_metadata?.role === 'employer') {
    return <Navigate to="/employer/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 selection:bg-emerald-500/30">
      <Navbar />
      <main className="w-full relative">
        {children}
      </main>
    </div>
  );
};

const EmployerRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.user_metadata?.role !== 'employer') {
    return <Navigate to="/seeker/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 selection:bg-emerald-500/30">
      <Navbar />
      <main className="w-full relative">
        {children}
      </main>
    </div>
  );
};

// Root Redirect component to direct users to their correct dashboard immediately
const RootRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.user_metadata?.role === 'employer') {
    return <Navigate to="/employer/dashboard" replace />;
  } else {
    return <Navigate to="/seeker/dashboard" replace />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />

          {/* Root Route - Handles role-based redirection */}
          <Route path="/" element={<RootRedirect />} />

          {/* Job Seeker Routes */}
          <Route path="/seeker/dashboard" element={<RequireAuth><JobSeekerRoute><SeekerDashboard /></JobSeekerRoute></RequireAuth>} />
          <Route path="/seeker/jobs" element={<RequireAuth><JobSeekerRoute><SeekerFindJobs /></JobSeekerRoute></RequireAuth>} />
          <Route path="/seeker/jobs/:id" element={<RequireAuth><JobSeekerRoute><SeekerJobDetails /></JobSeekerRoute></RequireAuth>} />
          <Route path="/seeker/saved-jobs" element={<RequireAuth><JobSeekerRoute><SeekerSavedJobs /></JobSeekerRoute></RequireAuth>} />
          <Route path="/seeker/applications" element={<RequireAuth><JobSeekerRoute><SeekerApplications /></JobSeekerRoute></RequireAuth>} />
          <Route path="/seeker/profile" element={<RequireAuth><JobSeekerRoute><SeekerProfile /></JobSeekerRoute></RequireAuth>} />
          
          {/* Employer Routes */}
          <Route path="/employer/dashboard" element={<RequireAuth><EmployerRoute><EmployerDashboard /></EmployerRoute></RequireAuth>} />
          <Route path="/employer/jobs" element={<RequireAuth><EmployerRoute><EmployerManageJobs /></EmployerRoute></RequireAuth>} />
          <Route path="/employer/jobs/new" element={<RequireAuth><EmployerRoute><EmployerPostJob /></EmployerRoute></RequireAuth>} />
          <Route path="/employer/jobs/edit/:id" element={<RequireAuth><EmployerRoute><EmployerEditJob /></EmployerRoute></RequireAuth>} />
          <Route path="/employer/applicants" element={<RequireAuth> 
            <EmployerRoute><EmployerApplicants /></EmployerRoute></RequireAuth>}/>
          <Route path="/employer/profile" element={<RequireAuth><EmployerRoute><EmployerProfile /></EmployerRoute></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
