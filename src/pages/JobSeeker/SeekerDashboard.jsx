import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, Bookmark, ChevronRight, Search, Send, Eye, Star, MessageSquare, Trophy, XCircle } from 'lucide-react';

// Animated count-up component
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const diff = end - start;
    if (diff === 0) {
      setDisplay(end);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

// Helper function to format dates nicely
const formatDate = (dateString) => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper function to get colors and icons based on status
const getStatusConfig = (status) => {
  switch (status) {
    case 'Applied':
      return { icon: Send, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', dotClass: 'bg-blue-500' };
    case 'Under Review':
      return { icon: Eye, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', dotClass: 'bg-purple-500' };
    case 'Shortlisted':
      return { icon: Star, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', dotClass: 'bg-amber-500' };
    case 'Interview':
      return { icon: MessageSquare, colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10', dotClass: 'bg-cyan-500' };
    case 'Selected':
      return { icon: CheckCircle, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', dotClass: 'bg-emerald-500' };
    case 'Rejected':
      return { icon: XCircle, colorClass: 'text-rose-400', bgClass: 'bg-rose-500/10', dotClass: 'bg-rose-500' };
    default:
      return { icon: Briefcase, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', dotClass: 'bg-slate-500' };
  }
};

export default function SeekerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalApplications: 0,
    shortlisted: 0,
    rejected: 0,
    savedJobs: 0
  });
  const [weeklyStats, setWeeklyStats] = useState({
    appsThisWeek: 0,
    shortlistedThisWeek: 0
  });
  const [pipelineCounts, setPipelineCounts] = useState({
    'Applied': 0,
    'Under Review': 0,
    'Shortlisted': 0,
    'Interview': 0,
    'Selected': 0
  });
  // const [recentJobs, setRecentJobs] = useState([]);
  // const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [searchQuery, setSearchQuery] = useState('');

  // NEW STATES FOR JOBS FOR YOU
  const [recommendedJobsMatch, setRecommendedJobsMatch] = useState([]);
  const [hasProfile, setHasProfile] = useState(true);

  const rawFirstName = user?.user_metadata?.full_name?.split(' ')[0] || 'User';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);

  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     navigate(`/seeker/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
  //   } else {
  //     navigate('/seeker/jobs');
  //   }
  // };

  const handleSaveJob = async (job) => {
    try {
      await supabase.from('saved_jobs').insert([{ 
        user_id: user.id, 
        job_id: job.id, 
        job_title: job.title 
      }]);
      setRecommendedJobsMatch(prev => prev.filter(j => j.id !== job.id));
      alert("Job saved successfully!");
      fetchDashboardData();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const { data: appsData } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false });
      const apps = appsData || [];
      const shortlisted = apps.filter(app => app.status === 'Shortlisted').length;
      const rejected = apps.filter(app => app.status === 'Rejected').length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const appsThisWeek = apps.filter(app => new Date(app.applied_at) >= oneWeekAgo).length;
      const shortlistedThisWeek = apps.filter(app => app.status === 'Shortlisted' && new Date(app.applied_at) >= oneWeekAgo).length;

      const pCounts = {
        'Applied': apps.filter(app => app.status === 'Applied').length,
        'Under Review': apps.filter(app => app.status === 'Under Review').length,
        'Shortlisted': apps.filter(app => app.status === 'Shortlisted').length,
        'Interview': apps.filter(app => app.status === 'Interview').length,
        'Selected': apps.filter(app => app.status === 'Selected').length,
      };

      let savedJobsCount = 0;
      try {
        const { count, error: savedError } = await supabase
          .from('saved_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (!savedError && count !== null) {
          savedJobsCount = count;
        }
      } catch {}

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        totalApplications: apps.length,
        shortlisted,
        rejected,
        savedJobs: savedJobsCount
      });
      setWeeklyStats({ appsThisWeek, shortlistedThisWeek });
      setPipelineCounts(pCounts);
      setRecentApplications(apps.slice(0, 3));
      setRecentJobs(jobsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchDashboardData().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const appsChannel = supabase
      .channel('dashboard-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${user.id}` }, () => {
        fetchDashboardData();
      }).subscribe();

    const savedChannel = supabase
      .channel('dashboard-saved-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_jobs', filter: `user_id=eq.${user.id}` }, () => {
        fetchDashboardData();
      }).subscribe();

    return () => {
      supabase.removeChannel(appsChannel);
      supabase.removeChannel(savedChannel);
    };
  }, [user]);

  const getSubtext = (type) => {
    switch (type) {
      case 'applications':
        if (weeklyStats.appsThisWeek > 0) return `${weeklyStats.appsThisWeek} this week`;
        if (stats.totalApplications > 0) return 'Keep applying!';
        return 'Start applying today';
      case 'shortlisted':
        if (weeklyStats.shortlistedThisWeek > 0) return `${weeklyStats.shortlistedThisWeek} this week`;
        if (stats.shortlisted > 0) return 'Great progress!';
        return 'Keep applying';
      case 'rejected':
        if (stats.rejected > 0) return 'Keep pushing forward';
        return 'Stay positive';
      case 'saved':
        if (stats.savedJobs > 0) return `${stats.savedJobs} saved`;
        return 'Save jobs you like';
      default:
        return '';
    }
  };

  const statCards = [
    { title: 'Total Applications', value: stats.totalApplications, icon: Briefcase, subtext: getSubtext('applications'), gradient: 'from-blue-500/20 to-blue-600/5', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', borderHover: 'hover:border-blue-500/40', glowColor: 'hover:shadow-blue-500/10' },
    { title: 'Shortlisted', value: stats.shortlisted, icon: Clock, subtext: getSubtext('shortlisted'), gradient: 'from-amber-500/20 to-amber-600/5', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', borderHover: 'hover:border-amber-500/40', glowColor: 'hover:shadow-amber-500/10' },
    { title: 'Rejected', value: stats.rejected, icon: XCircle, subtext: getSubtext('rejected'), gradient: 'from-rose-500/20 to-rose-600/5', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400', borderHover: 'hover:border-rose-500/40', glowColor: 'hover:shadow-rose-500/10' },
    { title: 'Saved Jobs', value: stats.savedJobs, icon: Bookmark, subtext: getSubtext('saved'), gradient: 'from-purple-500/20 to-purple-600/5', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400', borderHover: 'hover:border-purple-500/40', glowColor: 'hover:shadow-purple-500/10' }
  ];

  const stages = [
    { id: 'Applied', label: 'Applied', icon: Send },
    { id: 'Under Review', label: 'Under Review', icon: Eye },
    { id: 'Shortlisted', label: 'Shortlisted', icon: Star },
    { id: 'Interview', label: 'Interview', icon: MessageSquare },
    { id: 'Selected', label: 'Selected', icon: Trophy }
  ];

  let activeIndex = -1;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (pipelineCounts[stages[i].id] > 0) {
      activeIndex = i;
      break;
    }
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-5rem)] p-4 sm:p-8">
      <div className="w-full max-w-6xl">

        {/* Animated Welcome / Hero Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 shadow-2xl">
          <style>{`
            @keyframes floatSlow {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50% { transform: translate(30px, -20px) scale(1.1); }
            }
            @keyframes floatSlower {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50% { transform: translate(-20px, 15px) scale(1.05); }
            }
          `}</style>

          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" style={{ animation: 'floatSlow 8s ease-in-out infinite' }} />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" style={{ animation: 'floatSlower 10s ease-in-out infinite' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-400/5 blur-3xl pointer-events-none" style={{ animation: 'floatSlow 12s ease-in-out infinite' }} />

          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 text-center mt-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{firstName}</span>! 
            </h1>
            <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Ready to find your next opportunity?
            </p>

            
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={`relative overflow-hidden p-5 border border-slate-700/50 rounded-2xl bg-gradient-to-br ${card.gradient} backdrop-blur-sm shadow-lg ${card.borderHover} ${card.glowColor} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}>
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-white/3 blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg}`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                  <AnimatedNumber value={card.value} duration={1400 + index * 200} />
                </p>
                <p className="text-sm font-medium text-slate-300 mb-2">{card.title}</p>
                <p className="text-xs text-slate-500">{card.subtext}</p>
              </div>
            );
          })}
        </div>

        {/* --- JOBS FOR YOU SECTION --- */}
        {/* {hasProfile && recommendedJobsMatch.length > 0 && (
          <div className="w-full mb-10 p-6 sm:p-8 bg-slate-800/40 border border-slate-700/50 shadow-xl rounded-3xl backdrop-blur-sm">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Jobs For You</h2>
                <p className="text-slate-400 text-sm">Recommended based on your skills</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendedJobsMatch.map((job) => (
                <div key={job.id} className="p-5 bg-slate-900/50 border border-slate-700/50 rounded-2xl flex flex-col hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1" title={job.title}>{job.title}</h3>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md ml-2 whitespace-nowrap">{job.matchPercentage}% Match</span>
                  </div>
                  <div className="text-sm text-slate-400 mb-4 space-y-1">
                    <p className="font-medium text-slate-300">{job.company}</p>
                    <p>{job.location} � {job.job_type}</p>
                    <p className="text-emerald-400 font-medium">{job.salary}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                    {job.parsedSkills.slice(0, 4).map(skill => (
                      <span key={skill} className={`text-[10px] px-2 py-0.5 rounded-full border ${job.matchedSkills.includes(skill) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{skill}</span>
                    ))}
                    {job.parsedSkills.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500">+{job.parsedSkills.length - 4}</span>}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link to={`/seeker/jobs/${job.id}`} className="flex-1 flex justify-center items-center py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors">View Job</Link>
                    <button onClick={() => handleSaveJob(job)} className="p-2 border border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 bg-slate-900/50 hover:bg-emerald-500/10 rounded-xl transition-all" title="Save Job"><Bookmark className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasProfile && (
          <div className="w-full mb-10 p-6 sm:p-8 bg-slate-800/40 border border-slate-700/50 shadow-xl rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3"><Star className="w-6 h-6 text-emerald-400" /></div>
             <h2 className="text-xl font-bold text-white mb-2">Jobs For You</h2>
             <p className="text-slate-400 mb-5 max-w-md">Add your skills to your profile to see jobs that match your experience.</p>
             <Link to="/seeker/profile" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors">Complete Profile</Link>
          </div>
        )} */}
       
        {/* Job Search Progress Section */}
        <div className="w-full mb-10 p-6 sm:p-8 bg-slate-800/40 border border-slate-700/50 shadow-xl rounded-3xl backdrop-blur-sm">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Your Job Search Progress</h2>
            <p className="text-slate-400 text-sm sm:text-base">Track your applications through each stage.</p>
          </div>

          {stats.totalApplications === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 mb-6 text-base sm:text-lg">Your application journey starts here.</p>
              <Link to="/seeker/jobs" className="inline-flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                Find Jobs <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="relative pt-2 pb-4 md:py-4">
              <div className="hidden md:block absolute top-[24px] sm:top-[28px] left-[10%] right-[10%] h-1 bg-slate-800 rounded-full -translate-y-1/2 z-0">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, (activeIndex / (stages.length - 1)) * 100)}%` }}></div>
              </div>
              <div className="md:hidden absolute top-[10%] bottom-[10%] left-[24px] w-1 bg-slate-800 rounded-full -translate-x-1/2 z-0">
                <div className="w-full bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out" style={{ height: `${Math.max(0, (activeIndex / (stages.length - 1)) * 100)}%` }}></div>
              </div>

              <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-0">
                {stages.map((stage, index) => {
                  const count = pipelineCounts[stage.id] || 0;
                  const isCompleted = index < activeIndex;
                  const isActive = index === activeIndex;
                  let iconBg = 'bg-slate-900 border-slate-700';
                  let iconColor = 'text-slate-500';
                  let textColor = 'text-slate-500';

                  if (isCompleted) {
                    iconBg = 'bg-slate-900 border-emerald-500';
                    iconColor = 'text-emerald-400';
                    textColor = 'text-slate-300';
                  } else if (isActive) {
                    iconBg = 'bg-gradient-to-br from-emerald-400 to-cyan-400 border-transparent shadow-[0_0_15px_rgba(52,211,153,0.4)]';
                    iconColor = 'text-slate-950';
                    textColor = 'text-white';
                  }

                  return (
                    <div key={stage.id} className="flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1 group">
                      <div className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${iconBg} ${isActive ? 'scale-110' : ''}`}>
                        <stage.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
                      </div>
                      <div className="flex flex-col md:items-center text-left md:text-center mt-0 md:mt-2">
                        <p className={`font-bold transition-colors ${textColor} text-sm sm:text-base`}>{stage.label}</p>
                        <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1 sm:mt-1.5 flex items-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 sm:px-2.5 bg-slate-900 rounded-md border border-slate-700/50 min-w-[2.5rem]">
                            <AnimatedNumber value={count} duration={1000 + index * 200} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}