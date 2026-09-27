import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Building, MapPin, IndianRupee, Briefcase, Calendar, ArrowLeft, CheckCircle, Bookmark, Code, ClipboardList, Gift } from 'lucide-react';

export default function SeekerJobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setJob(data);

        // Automatically increase the view count in Supabase by 1
        if (data) {
          await supabase
            .from('jobs')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id);
        }

        if (user) {
          const { data: appData } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (appData) setHasApplied(true);
          
          const { data: savedData } = await supabase
            .from('saved_jobs')
            .select('id')
            .eq('job_id', id)
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (savedData) setIsSaved(true);
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [id, user]);

  const handleApply = async () => {
    if (!user || !job) return;
    
    setApplying(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.from('applications').insert([
        { 
          user_id: user.id, 
          job_id: job.id, 
          job_title: job.title,
          applicant_email: user.email,
          status: 'Applied' 
        }
      ]);

      if (error) {
        //PostgreSQL's unique constraint violation.
        if (error.code === '23505') {
          setMessage({ text: "You have already applied for this position.", type: "error" });
          setHasApplied(true);
        } else {
          throw error;
        }
      } else {
        setHasApplied(true);
        setMessage({ text: "Application submitted successfully!", type: "success" });
      }
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setApplying(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !job) return;
    setSaving(true);
    
    try {
      if (isSaved) {
        await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', job.id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_jobs')
          .insert([{ user_id: user.id, job_id: job.id }]);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling saved job:", error);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-2xl font-black text-white mb-2">Job Not Found</h2>
        <p className="text-slate-400 mb-6 font-medium">The job you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/seeker/jobs')} className="px-6 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors border border-slate-700">
          Back to Jobs
        </button>
      </div>
    );
  }

  const renderRequirements = (text) => {
    if (!text) return null;

    if (!text.includes('[ Skills & Experience ]')) {
      return <div className="whitespace-pre-line text-slate-300 font-medium leading-relaxed">{text}</div>;
    }

    // Split the text into sections everywhere there is a bracket [ ]
    const sections = text.split(/(?=\[.*?\])/).filter(Boolean);

    return (
      <div className="grid grid-cols-1 gap-4 mt-2">
        {sections.map((section, idx) => {
          const lines = section.trim().split('\n');
          // Remove the brackets for the title
          const title = lines[0].replace(/\[|\]/g, '').trim(); 
          // The rest of the lines become the content
          const content = lines.slice(1).join('\n').trim();

          // Pick a matching icon based on the title!
          let Icon = Briefcase;
          if (title.includes('Skills')) Icon = Code;
          else if (title.includes('Responsibilities')) Icon = ClipboardList;
          else if (title.includes('Perks')) Icon = Gift;

          return (
            <div key={idx} className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl hover:border-emerald-500/30 transition-all shadow-lg">
              <h4 className="text-emerald-400 font-bold text-lg mb-3 flex items-center gap-2 border-b border-slate-700/50 pb-2">
                <Icon className="w-5 h-5" />
                {title}
              </h4>
              <div className="text-slate-300 text-[15px] leading-relaxed whitespace-pre-line">
                {content}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-4xl mx-auto w-full">
      
      {/* Back Button */}
      <Link to="/seeker/jobs" className="inline-flex items-center text-slate-400 hover:text-emerald-400 font-bold mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Jobs
      </Link>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 mb-6 rounded-2xl border font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-slate-800/40 border border-slate-700/50 shadow-lg backdrop-blur-sm rounded-3xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 sm:p-10 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">{job.title}</h1>
              <div className="flex items-center text-xl text-emerald-400 font-bold mb-6">
                <Building className="w-5 h-5 mr-2" /> {job.company}
              </div>
              
              <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-300">
                <div className="flex items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" /> {job.location}
                </div>
                <div className="flex items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <Briefcase className="w-4 h-4 mr-2 text-slate-400" /> {job.job_type || 'Full-time'}
                </div>
                <div className="flex items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <IndianRupee className="w-4 h-4 mr-2 text-slate-400" /> {job.salary || 'Not specified'}
                </div>
                <div className="flex items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Posted {new Date(job.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Action Button Desktop */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <button 
                onClick={handleToggleSave}
                disabled={saving}
                className={`p-3 border rounded-xl transition-colors shadow-sm ${isSaved ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/10'}`}
                title={isSaved ? "Remove from saved" : "Save this job"}
              >
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              
              {hasApplied ? (
                <button disabled className="px-8 py-3.5 font-bold border rounded-xl bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Application Sent
                </button>
              ) : (
                <button 
                  onClick={handleApply} 
                  disabled={applying}
                  className="px-8 py-3.5 font-bold transition-all rounded-xl bg-emerald-500 text-slate-950 shadow-sm hover:bg-emerald-400 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed border border-emerald-500"
                >
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6 sm:p-10 space-y-8 bg-slate-800/20">
          <section>
            <h3 className="text-xl font-black text-white mb-4">Job Description</h3>
            <div className="whitespace-pre-line text-slate-300 font-medium leading-relaxed">{job.description}</div>
          </section>
          
            {job.requirements && (
              <section>
                <h3 className="text-xl font-black text-white mb-4">Job Details & Requirements</h3>
                {renderRequirements(job.requirements)}
              </section>
            )}
          
          {/* Action Button Mobile */}
          <div className="md:hidden pt-6 border-t border-slate-700/50 flex gap-3">
            <button 
              onClick={handleToggleSave}
              disabled={saving}
              className={`p-3 border rounded-xl transition-colors shadow-sm flex items-center justify-center ${isSaved ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-slate-900/50 border-slate-700/50 text-slate-400'}`}
            >
              <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            
            {hasApplied ? (
              <button disabled className="flex-1 px-8 py-3.5 font-bold border rounded-xl bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default flex justify-center items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Applied
              </button>
            ) : (
              <button 
                onClick={handleApply} 
                disabled={applying}
                className="flex-1 px-8 py-3.5 font-bold transition-all rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed border border-emerald-500"
              >
                {applying ? 'Applying...' : 'Apply Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}