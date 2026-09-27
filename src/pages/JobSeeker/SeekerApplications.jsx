import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, Calendar, Building, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function SeekerApplications() {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [appToWithdraw, setAppToWithdraw] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            jobs (*)
          `)
          .eq('user_id', user.id)
          .order('applied_at', { ascending: false });

        if (!error) {
          setApplications(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  // 1. Opens the custom popup
  const handleWithdrawClick = (appId) => {
    setAppToWithdraw(appId);
  };

  // 2. Closes the popup if they click "Cancel"
  const cancelWithdraw = () => {
    setAppToWithdraw(null);
  };

  // 3. Actually deletes the application when they click "Yes, Withdraw" inside the popup
  const confirmWithdraw = async () => {
    if (!appToWithdraw) return;
    
    setWithdrawingId(appToWithdraw); // Start loading spinner/text
    
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appToWithdraw);

      if (error) throw error;
      
      // Remove the job from the local screen instantly
      setApplications(prevApps => prevApps.filter(app => app.id !== appToWithdraw));
      
    } catch (error) {
      console.error("Error withdrawing application:", error);
      alert("Failed to withdraw. Please try again.");
    } finally {
      setWithdrawingId(null); // Stop loading
      setAppToWithdraw(null); // Close the custom popup
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'Under Review': return { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Clock, label: 'Under Review' };
      case 'Shortlisted': return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: CheckCircle, label: 'Shortlisted' };
      case 'Selected': return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle, label: 'Selected' };
      case 'Rejected': return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: XCircle, label: 'Rejected' };
      case 'Applied':
      default: return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Briefcase, label: 'Applied' };
    }
  };

  const filteredApps = applications.filter(app => {
    const job = app.jobs;
    if (!job) return false;
    
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-5xl mx-auto w-full">
      
      {/* Header & Filters */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">My Applications</h1>
        <p className="text-slate-400 font-medium mb-8">Track the status of jobs you've applied to.</p>
        
        <div className="relative z-20 flex flex-col sm:flex-row gap-4 bg-slate-800/40 p-4 sm:p-5 rounded-3xl border border-slate-700/50 shadow-lg backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by role or company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder-slate-400"
            />
          </div>
          
          {/* Custom Dark Theme Dropdown */}
          <div className="relative sm:w-48">
            
            {/* The Dropdown Button */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl outline-none hover:border-emerald-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium cursor-pointer"
            >
              {statusFilter === 'All' ? 'All Statuses' : statusFilter}
              {/* Arrow Down Icon */}
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {/* The Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Invisible overlay: clicks outside the menu will close it */}
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                
                {/* The List of Options */}
                <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  
                  {/* We use an array and map() to keep the code clean and beginner-friendly */}
                  {['All', 'Applied', 'Under Review', 'Shortlisted', 'Selected', 'Rejected'].map((status) => (
                    <div
                      key={status}
                      onClick={() => {
                        setStatusFilter(status); // Update the filter
                        setIsDropdownOpen(false); // Close the menu
                      }}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        statusFilter === status 
                          ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {status === 'All' ? 'All Statuses' : status}
                    </div>
                  ))}
                  
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl shadow-sm">
          <Briefcase className="w-16 h-16 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 font-medium text-lg mb-2">No applications found.</p>
          {applications.length === 0 ? (
            <Link to="/seeker/jobs" className="mt-4 inline-block px-6 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-sm">
              Find Jobs to Apply
            </Link>
          ) : (
            <button 
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
              className="mt-4 text-emerald-400 hover:text-emerald-300 font-bold px-4 py-2 bg-emerald-500/10 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const job = app.jobs;
            const config = getStatusConfig(app.status);
            const StatusIcon = config.icon;
            
            return (
              <div key={app.id} className="p-5 sm:p-6 bg-slate-800/40 border border-slate-700/50 shadow-lg rounded-3xl flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-xl hover:shadow-emerald-500/10 transition-all backdrop-blur-sm group">
                
                {/* Job Info */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{job?.title || app.job_title}</h3>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${config.color}`}>
                      <StatusIcon className="w-4 h-4 mr-1.5" />
                      {config.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-emerald-400 font-bold mb-4">
                    <Building className="w-4 h-4 mr-1.5" /> {job?.company || 'Company Name'}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-300 font-medium">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-slate-400" /> {job?.location || 'Location'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-slate-400" /> Applied on {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="w-full md:w-auto flex flex-row md:flex-col gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/50">
                  
                  {/* View Job Button */}
                  <Link 
                    to={`/seeker/jobs/${app.job_id}`} 
                    className="flex-1 md:w-40 text-center px-4 py-2 text-sm font-bold transition-colors border rounded-xl border-slate-600 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    View Job
                  </Link>

                  {/* Withdraw Button */}
                  <button 
                    onClick={() => handleWithdrawClick(app.id)}
                    disabled={withdrawingId === app.id}
                    className="flex-1 md:w-40 text-center px-4 py-2 text-sm font-bold transition-colors border rounded-xl border-rose-500/30 text-rose-400 hover:border-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                  
                </div>
                
              </div>
            );
          })}
        </div>
      )}

      {/* --- CUSTOM WITHDRAW POPUP MODAL --- */}
      {appToWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          
          <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Withdraw Application</h3>
            <p className="text-slate-400 mb-8">
              Are you sure you want to withdraw this application? This action cannot be undone.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={cancelWithdraw}
                disabled={withdrawingId === appToWithdraw}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button 
                onClick={confirmWithdraw}
                disabled={withdrawingId === appToWithdraw}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {withdrawingId === appToWithdraw ? 'Withdrawing...' : 'Yes, Withdraw'}
              </button>
            </div>
          </div>
          
        </div>
      )}
      
    </div>
  );
}
