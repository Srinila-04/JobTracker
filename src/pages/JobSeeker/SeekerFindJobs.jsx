import { useState, useEffect} from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Briefcase, Bookmark, Sparkles, CheckCircle, ChevronRight, Building, MessageSquare, Send, X } from 'lucide-react';

// New Collapsible Filter Component
const FilterSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-700/50 pb-2 mb-4">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center py-2 text-slate-300 hover:text-white transition-colors group"
      >
        <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90 text-emerald-400' : 'group-hover:text-emerald-400'}`} />
      </button>
      {isOpen && (
        <div className="mt-3 space-y-3 pb-2 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default function SeekerFindJobs() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data State
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [titleQuery, setTitleQuery] = useState(searchParams.get('q') || '');
  const [locationQuery, setLocationQuery] = useState('');
  
  // Sidebar Filters State
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSalary, setSelectedSalary] = useState('');
  const [dateFilter, setDateFilter] = useState('any');

  // Animated Placeholder State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const searchWords = ['skill', 'company', 'role'];

  // ── Chat State & Functions ──
  const [chatJob, setChatJob] = useState(null);
  useEffect(() => {
    // Rotates the search word every 2.5 seconds
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [searchWords.length]);

  // Sync URL search param
  useEffect(() => {
    if (titleQuery) {
      setSearchParams({ q: titleQuery });
    } else {
      setSearchParams({});
    }
  }, [titleQuery, setSearchParams]);

  // Fetch jobs data
  useEffect(() => {
    const fetchJobsData = async () => {
      try {
        setLoading(true);

        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;
        setJobs(jobsData || []);

        if (user) {
          const { data: appsData } = await supabase.from('applications').select('job_id').eq('user_id', user.id);
          if (appsData) setAppliedJobs(new Set(appsData.map(app => app.job_id)));

          const { data: savesData } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
          if (savesData) setSavedJobs(new Set(savesData.map(save => save.job_id)));
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobsData();
  }, [user]);

  // Handle Save Toggle
  const toggleSaveJob = async (e, jobId) => {
    e.preventDefault();
    if (!user) return;
    const isSaved = savedJobs.has(jobId);
    try {
      if (isSaved) {
        await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
        setSavedJobs(prev => { const newSet = new Set(prev); newSet.delete(jobId); return newSet; });
      } else {
        await supabase.from('saved_jobs').insert([{ user_id: user.id, job_id: jobId }]);
        setSavedJobs(prev => { const newSet = new Set(prev); newSet.add(jobId); return newSet; });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  // Helper for array toggles
  const toggleArrayItem = (setter, item) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // Filter Logic
  const filteredJobs = jobs.filter(job => {
    const matchesTitle = job.title?.toLowerCase().includes(titleQuery.toLowerCase()) ||
                         job.company?.toLowerCase().includes(titleQuery.toLowerCase());
    const matchesLocation = locationQuery === '' || job.location?.toLowerCase().includes(locationQuery.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.job_type);
    
    const matchesExp = selectedExperience.length === 0 || !job.experience_level || selectedExperience.includes(job.experience_level);
    const matchesCat = selectedCategories.length === 0 || !job.category || selectedCategories.includes(job.category);
    
    let matchesDate = true;
    if (dateFilter !== 'any') {
      const jobDate = new Date(job.created_at);
      const now = new Date();
      const diffDays = (now - jobDate) / (1000 * 3600 * 24);
      if (dateFilter === '1day') matchesDate = diffDays <= 1;
      else if (dateFilter === '3days') matchesDate = diffDays <= 3;
      else if (dateFilter === '15days') matchesDate = diffDays <= 15;
      else if (dateFilter === '1month') matchesDate = diffDays <= 30;
    }

    return matchesTitle && matchesLocation && matchesType && matchesExp && matchesCat && matchesDate;
  });

  const uniqueJobTypes = [...new Set(jobs.map(job => job.job_type).filter(Boolean))];
  const experienceOptions = ['Entry Level', 'Intermediate', 'Expert'];
  const categoryOptions = ['IT', 'Finance', 'Design', 'Marketing', 'Sales', 'Engineering'];
  const salaryOptions = ['Under ₹5 LPA', '₹5 - ₹10 LPA', '₹10 - ₹20 LPA', '₹20+ LPA'];

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full relative">
      
      <style>{`
        @keyframes starTwinkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 10px rgba(52,211,153,0.8)); }
          50% { transform: scale(1.15) rotate(20deg); opacity: 0.8; filter: drop-shadow(0 0 20px rgba(52,211,153,0.4)); }
        }
        .animate-star {
          animation: starTwinkle 3s ease-in-out infinite;
        }
      `}</style>

      {/* HERO SECTION */}
      <div className="mb-12 pt-4 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-8 tracking-tight flex items-center justify-center sm:justify-start gap-4">
          Find Your Dream Job Here 
          <Sparkles className="w-10 h-10 text-emerald-400 animate-star" />
        </h1>
        
        <div className="relative p-2 sm:p-3 bg-slate-800/60 border border-slate-700/50 shadow-2xl rounded-full flex flex-col sm:flex-row items-center gap-2 backdrop-blur-md">
          
          <div className="relative flex-1 w-full group overflow-hidden">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors z-10" />
            
            <input 
              type="text" 
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white rounded-full outline-none font-medium z-10 relative"
            />
            
            {titleQuery === '' && (
              <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none text-slate-400 font-medium">
                <span className="whitespace-pre">Search by </span>
                <div className="h-6 overflow-hidden relative w-32">
                  <div 
                    className="flex flex-col transition-transform duration-500 ease-in-out absolute left-0"
                    style={{ transform: `translateY(-${placeholderIndex * 24}px)` }}
                  >
                    {searchWords.map((word, i) => (
                      <span key={i} className="h-[24px] flex items-center text-emerald-400 font-bold">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-slate-700/50"></div>
          
          <div className="relative flex-1 w-full group">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Add country or city..." 
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white rounded-full outline-none font-medium placeholder-slate-400"
            />
          </div>

          <button className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full transition-colors shadow-lg shadow-emerald-500/20">
            Search
          </button>
        </div>
      </div>

      {/* MAIN CONTENT: 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR FILTERS (Now with Dropdown Accordions) */}
        <div className="w-full lg:w-1/4 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm h-auto">
          <div className="flex justify-between items-center pb-6">
            <h2 className="text-lg font-bold text-white">Filters</h2>
            <button 
              onClick={() => {
                setSelectedTypes([]); setSelectedExperience([]); setSelectedCategories([]); setSelectedSalary(''); setDateFilter('any'); setLocationQuery('');
              }}
              className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          
          <FilterSection title="Job Type">
            {uniqueJobTypes.map(type => (
              <div key={type} onClick={() => toggleArrayItem(setSelectedTypes, type)} className="flex items-center gap-3 cursor-pointer group select-none">
                <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${selectedTypes.includes(type) ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-slate-600 group-hover:border-emerald-500'}`}>
                  {selectedTypes.includes(type) && <CheckCircle className="w-3 h-3 text-slate-950" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${selectedTypes.includes(type) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {type}
                </span>
              </div>
            ))}
          </FilterSection>

          <FilterSection title="Salary Range">
            {salaryOptions.map(option => (
              <div key={option} onClick={() => setSelectedSalary(selectedSalary === option ? '' : option)} className="flex items-center gap-3 cursor-pointer group select-none">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors border ${selectedSalary === option ? 'border-emerald-500' : 'bg-slate-900 border-slate-600 group-hover:border-emerald-500'}`}>
                  {selectedSalary === option && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${selectedSalary === option ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {option}
                </span>
              </div>
            ))}
          </FilterSection>

          <FilterSection title="Experience Level">
            {experienceOptions.map(exp => (
              <div key={exp} onClick={() => toggleArrayItem(setSelectedExperience, exp)} className="flex items-center gap-3 cursor-pointer group select-none">
                <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${selectedExperience.includes(exp) ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-slate-600 group-hover:border-emerald-500'}`}>
                  {selectedExperience.includes(exp) && <CheckCircle className="w-3 h-3 text-slate-950" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${selectedExperience.includes(exp) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {exp}
                </span>
              </div>
            ))}
          </FilterSection>

          <FilterSection title="Job Categories">
            {categoryOptions.map(cat => (
              <div key={cat} onClick={() => toggleArrayItem(setSelectedCategories, cat)} className="flex items-center gap-3 cursor-pointer group select-none">
                <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${selectedCategories.includes(cat) ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-slate-600 group-hover:border-emerald-500'}`}>
                  {selectedCategories.includes(cat) && <CheckCircle className="w-3 h-3 text-slate-950" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${selectedCategories.includes(cat) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {cat}
                </span>
              </div>
            ))}
          </FilterSection>

          <FilterSection title="Date Posted">
            {[
              { label: 'Any Time', value: 'any' },
              { label: 'Past 24 Hours', value: '1day' },
              { label: 'Past 3 Days', value: '3days' },
              { label: 'Past 15 Days', value: '15days' },
              { label: 'Past Month', value: '1month' }
            ].map(option => (
              <div 
                key={option.value} 
                onClick={() => setDateFilter(option.value)} 
                className="flex items-center gap-3 cursor-pointer group select-none"
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors border ${dateFilter === option.value ? 'border-emerald-500' : 'bg-slate-900 border-slate-600 group-hover:border-emerald-500'}`}>
                  {dateFilter === option.value && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${dateFilter === option.value ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {option.label}
                </span>
              </div>
            ))}
          </FilterSection>

        </div>

        {/* JOB GRID */}
        <div className="w-full lg:w-3/4">
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl">
              <p className="text-slate-400 text-lg font-medium">No jobs match your search criteria.</p>
              <button 
                onClick={() => { setTitleQuery(''); setLocationQuery(''); setSelectedTypes([]); setSelectedExperience([]); setSelectedCategories([]); setDateFilter('any'); }}
                className="mt-4 text-emerald-400 hover:text-emerald-300 font-bold px-4 py-2 bg-emerald-500/10 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => {
                const hasApplied = appliedJobs.has(job.id);
                const isSaved = savedJobs.has(job.id);
                
                return (
                  <Link 
                    to={`/seeker/jobs/${job.id}`} 
                    key={job.id} 
                    className="block p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 group"
                  >
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/50 flex items-center justify-center shrink-0">
                          <Building className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <p className="text-slate-400 text-sm font-medium line-clamp-1">
                            {job.company}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 relative z-10">

                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSaveJob(e, job.id);
                          }}
                          className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-700'}`}
                        >
                          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.job_type && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                          {job.job_type}
                        </span>
                      )}
                      {job.experience_level && (
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold">
                          {job.experience_level}
                        </span>
                      )}
                      {job.location && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                          {job.location}
                        </span>
                      )}
                      {hasApplied && (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Applied
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 line-clamp-2 mb-6">
                      {job.description ? job.description : 'Click to view full job description, requirements, and apply.'}
                    </p>
                    
                    <div className="flex justify-between items-end pt-4 border-t border-slate-700/50">
                      <div className="text-white font-bold text-lg">
                        {job.salary || 'Not disclosed'}
                      </div>
                      <div className="text-slate-500 text-xs font-medium flex items-center gap-1">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>



    </div>
  );
}
