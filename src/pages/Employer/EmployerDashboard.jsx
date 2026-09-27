import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

import WelcomeHeader from '../../components/Employer/WelcomeHeader';
import JobPerformance from '../../components/Employer/JobPerformance';
import HiringAttention from '../../components/Employer/HiringAttention';
import ApplicationTrend from '../../components/Employer/ApplicationTrend';

export default function EmployerDashboard() {
  const { user } = useAuth();
  
  const [myJobs, setMyJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (jobsData) {
        setMyJobs(jobsData);
        
        if (jobsData.length > 0) {
          const myJobIds = jobsData.map(job => job.id);
          const { data: appsData } = await supabase
            .from('applications')
            .select('*')
            .in('job_id', myJobIds);
            
          if (appsData) setApplicants(appsData);
        }
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-5rem)] p-4 sm:p-8">
      {/* Container is now entirely focused on the Dashboard overview */}
      <div className="w-full max-w-7xl p-6 border shadow-2xl bg-slate-900/40 border-slate-700/50 rounded-3xl backdrop-blur-xl">
        <div className="space-y-10">
          <WelcomeHeader />
          <JobPerformance jobs={myJobs} applications={applicants} />
          <HiringAttention applications={applicants} />
          <ApplicationTrend applications={applicants} />
        </div>
      </div>
    </div>
  );
}