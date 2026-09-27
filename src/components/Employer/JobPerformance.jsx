import { useState, useEffect } from 'react';
import { Eye, Mail, CheckCircle, Star, ChevronDown, Briefcase } from 'lucide-react';

export default function JobPerformance({ jobs, applications }) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (jobs && jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  if (!jobs || jobs.length === 0) {
    return (
      <div className="p-8 text-center border shadow-lg bg-slate-800/50 border-slate-700/50 rounded-2xl">
        <h3 className="text-lg font-bold text-white">No job performance data yet</h3>
        <p className="mt-2 text-slate-400">Post your first job to start tracking performance.</p>
      </div>
    );
  }

  const activeJob = jobs.find(job => job.id === selectedJobId) || jobs[0];
  const jobApps = applications.filter(app => app.job_id === activeJob.id);
  const appCount = jobApps.length;
  const qualifiedCount = jobApps.filter(app => app.status === 'Shortlisted').length;
  const strongMatchCount = jobApps.filter(app => app.status === 'Selected').length;

  return (
    <div className="p-6 transition-all duration-300 border shadow-lg bg-slate-800/60 border-slate-700 rounded-2xl hover:border-slate-500">
      
      <div className="flex flex-col items-start justify-between mb-8 sm:flex-row sm:items-center gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Briefcase className="text-emerald-400" />
          Job Performance
        </h2>
        
        {/* Custom styled dropdown wrapper */}
        <div className="relative w-full sm:w-auto">
          
          {/* 1. The Dropdown Button */}
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full sm:w-64 px-4 py-2.5 font-medium text-white transition-all border outline-none cursor-pointer bg-slate-900 border-slate-700 rounded-xl hover:border-slate-500 shadow-sm"
          >
            <span className="truncate pr-4">{activeJob?.title || 'Select a job'}</span>
            <ChevronDown className={`text-slate-400 transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
          </button>

          {/* 2. Invisible overlay (Closes dropdown if you click anywhere else on the screen) */}
          {isDropdownOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
            ></div>
          )}

          {/* 3. The Sleek Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 z-50 w-full sm:w-64 mt-2 overflow-hidden border shadow-2xl bg-slate-800 border-slate-700 rounded-xl">
              <div className="max-h-60 overflow-y-auto">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setIsDropdownOpen(false); // Close menu after selecting
                    }}
                    className={`px-4 py-3 cursor-pointer transition-colors text-sm hover:bg-slate-700 ${
                      selectedJobId === job.id 
                        ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-4 border-emerald-500' 
                        : 'text-slate-300 border-l-4 border-transparent'
                    }`}
                  >
                    {job.title}
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>

      </div>
      
      <div key={activeJob.id} className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in">
        
        <div className="flex flex-col p-5 transition-all duration-300 border shadow-sm rounded-xl bg-slate-900/60 border-slate-700/80 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)] group">
          <div className="flex items-center gap-2 mb-3 text-indigo-400 group-hover:text-indigo-300">
            <Eye size={18} />
            <span className="text-sm font-semibold tracking-wide uppercase">Views</span>
          </div>
          <span className="text-4xl font-extrabold text-white">{activeJob?.views || 0}</span>
        </div>
        
        <div className="flex flex-col p-5 transition-all duration-300 border shadow-sm rounded-xl bg-slate-900/60 border-slate-700/80 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] group">
          <div className="flex items-center gap-2 mb-3 text-blue-400 group-hover:text-blue-300">
            <Mail size={18} />
            <span className="text-sm font-semibold tracking-wide uppercase">Applications</span>
          </div>
          <span className="text-4xl font-extrabold text-white">{appCount}</span>
        </div>

        <div className="flex flex-col p-5 transition-all duration-300 border shadow-sm rounded-xl bg-slate-900/60 border-slate-700/80 hover:-translate-y-1 hover:border-yellow-500/50 hover:shadow-[0_4px_20px_rgba(234,179,8,0.15)] group">
          <div className="flex items-center gap-2 mb-3 text-yellow-400 group-hover:text-yellow-300">
            <CheckCircle size={18} />
            <span className="text-sm font-semibold tracking-wide uppercase">Qualified</span>
          </div>
          <span className="text-4xl font-extrabold text-white">{qualifiedCount}</span>
        </div>

        <div className="flex flex-col p-5 transition-all duration-300 border shadow-sm rounded-xl bg-slate-900/60 border-slate-700/80 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)] group">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 group-hover:text-emerald-300">
            <Star size={18} />
            <span className="text-sm font-semibold tracking-wide uppercase">Strong Matches</span>
          </div>
          <span className="text-4xl font-extrabold text-white">{strongMatchCount}</span>
        </div>

      </div>
    </div>
  );
}