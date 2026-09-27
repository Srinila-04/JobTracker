import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, IndianRupee, Trash2, Bookmark } from 'lucide-react';

export default function SeekerSavedJobs() {
  const { user } = useAuth();
  
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        // Fetch saved jobs along with the actual job data
        // Assuming a table structure where saved_jobs has a foreign key to jobs
        const { data, error } = await supabase
          .from('saved_jobs')
          .select(`
            id,
            job_id,
            jobs (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          // If the table doesn't exist yet, we catch the error gracefully
          console.error("Error fetching saved jobs:", error);
          setSavedJobs([]);
        } else {
          setSavedJobs(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, [user]);

  const handleRemove = async (savedJobId) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('id', savedJobId);
        
      if (!error) {
        setSavedJobs(prev => prev.filter(job => job.id !== savedJobId));
      }
    } catch (error) {
      console.error("Error removing saved job:", error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-5rem)] p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Saved Jobs</h1>
            <p className="text-slate-400">Keep track of opportunities you're interested in.</p>
          </div>
        </div>

        {/* Saved Jobs List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/20 border border-slate-700/50 rounded-2xl">
            <Bookmark className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg mb-4">You haven't saved any jobs yet.</p>
            <Link to="/seeker/jobs" className="inline-block px-6 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedJobs.map((savedRecord) => {
              const job = savedRecord.jobs;
              if (!job) return null; // Safety check in case job was deleted

              return (
                <div key={savedRecord.id} className="p-6 border shadow-lg bg-slate-800/40 border-slate-700/50 rounded-2xl flex flex-col hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{job.title}</h3>
                      <p className="text-emerald-400 font-medium">{job.company}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleRemove(savedRecord.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove from saved jobs"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-6 flex-grow">
                    <div className="flex items-center text-sm text-slate-400">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="line-clamp-1">{job.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                      <Briefcase className="w-4 h-4 mr-2 text-slate-500" />
                      <span>{job.job_type || 'Full-time'}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                      <IndianRupee className="w-4 h-4 mr-2 text-slate-500" />
                      <span>{job.salary || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-700/50 mt-auto flex gap-3">
                    <Link 
                      to={`/seeker/jobs/${job.id}`} 
                      className="flex-1 text-center py-2.5 font-bold transition-colors border rounded-lg border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
