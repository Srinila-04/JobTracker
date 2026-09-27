import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Briefcase, MapPin, Edit, Trash2, Check } from 'lucide-react'; // <-- Added Check import
import { Link } from 'react-router-dom';

export default function EmployerManageJobs() {
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobToDelete, setJobToDelete] = useState(null); 
  
  // 1. Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // 2. Function to trigger the toast
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000); // Hides after 3 seconds
  };

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', user.id)
          .order('created_at', { ascending: false });
          
        if (!error) setJobs(data || []);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [user]);

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete.id);
      if (error) throw error;
      
      // Remove from UI and close modal
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete.id));
      setJobToDelete(null); 
      
      // 3. Show our beautiful Toast!
      showToast("Job deleted successfully!");
      
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-4 sm:p-8 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Jobs</h1>
            <p className="text-slate-400 mt-1">View, edit, and manage your job postings.</p>
          </div>
          
          <Link to="/employer/jobs/new" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            Post a Job
          </Link>
        </div>

        {/* Jobs List Section */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl backdrop-blur-xl p-6 shadow-xl">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading your jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="text-xl font-bold text-white mb-2">No jobs posted yet</h3>
              <Link to="/employer/jobs/new" className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg inline-flex items-center gap-2 mt-4">
                <Plus className="w-5 h-5" /> Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="p-5 border border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Job Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between md:justify-start gap-3 mb-2">
                        <h2 className="text-xl font-bold text-white">{job.title}</h2>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-500" /> {job.location || 'Remote'}</div>
                        <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-500" /> {job.job_type || 'Full-time'}</div>
                        <div className="flex items-center gap-1.5"><span className="text-slate-500 text-xs">Posted:</span> {formatDate(job.created_at)}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6 pt-4 md:pt-0 border-t border-slate-700/50 md:border-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/employer/jobs/edit/${job.id}`} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Edit Job">
                          <Edit className="w-5 h-5" />
                        </Link>
                        
                        <button onClick={() => setJobToDelete(job)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Job">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setJobToDelete(null)}>
          <div className="w-full max-w-md p-6 bg-slate-800 border border-slate-700/50 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-full text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Job?</h3>
            </div>
            <p className="mb-6 text-sm text-slate-300">
              Are you sure you want to delete <strong>"{jobToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setJobToDelete(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Guaranteed-Visible Toast Notification --- */}
      {toast.show && (
        <div className="fixed top-24 right-8 z-50">
          <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500 shadow-2xl rounded-xl border border-emerald-400">
            <Check className="w-6 h-6 text-white" /> 
            <p className="text-white font-bold text-lg">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}