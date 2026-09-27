import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, MapPin, Briefcase, Calendar, 

  FileText, User, ChevronDown, UserCheck, Users, 
  AlertCircle, X, Send, ArrowLeft, CheckCircle
} from "lucide-react";

export default function EmployerApplicants() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedJob, setSelectedJob] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ---- CHAT STATE ----








  // This ref is used to scroll the chat window to the bottom automatically


  useEffect(() => {
    const fetchApplicantsData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title")
          .eq("employer_id", user.id);

        if (jobsError) throw jobsError;
        setJobs(jobsData || []);

        if (jobsData && jobsData.length > 0) {
          const jobIds = jobsData.map(j => j.id);

          const { data: appsData, error: appsError } = await supabase
            .from("applications")
            .select("*")
            .in("job_id", jobIds)
            .order("applied_at", { ascending: false });

          if (appsError) throw appsError;

          if (appsData && appsData.length > 0) {
            const userIds = [...new Set(appsData.map(a => a.user_id))];

            const { data: profilesData, error: profError } = await supabase
              .from("profiles")
              .select("*")
              .in("id", userIds);

            if (profError) throw profError;

            const { data: expData, error: expError } = await supabase
              .from("experience")
              .select("*")
              .in("user_id", userIds);

            if (expError) throw expError;

            const enrichedApps = appsData.map(app => {
              const profile = profilesData?.find(p => p.id === app.user_id) || {};
              const exps = expData?.filter(e => e.user_id === app.user_id) || [];
              const jobInfo = jobsData.find(j => j.id === app.job_id);

              let totalMonths = 0;
              exps.forEach(exp => {
                if (exp.start_date) {
                  const start = new Date(exp.start_date + "-01");
                  const end = exp.current ? new Date() : (exp.end_date ? new Date(exp.end_date + "-01") : new Date());
                  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                  totalMonths += Math.max(0, months);
                }
              });
              
              const expYears = Math.floor(totalMonths / 12);
              const expString = expYears > 0 
                ? `${expYears} year${expYears > 1 ? "s" : ""} experience` 
                : (totalMonths > 0 ? `${totalMonths} months experience` : "Fresher");

              return {
                ...app,
                profile,
                experienceDetails: exps,
                expString,
                jobTitle: jobInfo?.title || app.job_title
              };
            });

            setApplications(enrichedApps);
          } else {
            setApplications([]);
          }
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicantsData();
  }, [user]);

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;

      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));

      if (selectedApplicant && selectedApplicant.id === appId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (selectedJob !== "All" && app.job_id !== selectedJob) return false;
    
    if (statusFilter !== "All") {
       if (statusFilter === "New" && app.status !== "Applied") return false;
       else if (statusFilter === "Reviewing" && app.status !== "Under Review") return false;
       else if (statusFilter !== "New" && statusFilter !== "Reviewing" && app.status !== statusFilter) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = app.profile.full_name?.toLowerCase().includes(query);
      const emailMatch = app.applicant_email?.toLowerCase().includes(query);
      const titleMatch = app.jobTitle?.toLowerCase().includes(query);
      const skillMatch = app.profile.skills?.some(s => s.toLowerCase().includes(query));
      
      if (!nameMatch && !emailMatch && !titleMatch && !skillMatch) return false;
    }

    return true;
  });

  const totalApps = applications.filter(a => selectedJob === "All" || a.job_id === selectedJob).length;
  const needsReviewCount = applications.filter(a => (selectedJob === "All" || a.job_id === selectedJob) && (a.status === "Applied" || a.status === "Under Review")).length;
  const shortlistedCount = applications.filter(a => (selectedJob === "All" || a.job_id === selectedJob) && a.status === "Shortlisted").length;
  const interviewCount = applications.filter(a => (selectedJob === "All" || a.job_id === selectedJob) && a.status === "Interview").length;

  const getStatusConfig = (status) => {
    switch(status) {
      case "Under Review": return { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Clock, label: "REVIEWING" };
      case "Shortlisted": return { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: UserCheck, label: "SHORTLISTED" };
      case "Interview": return { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Users, label: "INTERVIEW" };
      case "Selected": return { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, label: "SELECTED" };
      case "Rejected": return { color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: XCircle, label: "REJECTED" };
      case "Applied":
      default: return { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, label: "NEW" };
    }
  };

  const statusTabs = ["All", "New", "Reviewing", "Shortlisted", "Interview", "Rejected"];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Applicants</h1>
          <p className="text-slate-400 font-medium">Review and manage candidates who applied to your jobs.</p>
        </div>
        <div className="relative shrink-0 sm:w-64">
          <select 
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full appearance-none px-4 py-3 bg-slate-800 border border-slate-700 text-white font-medium rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
          >
            <option value="All">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search applicants by name, email, skills, or job title..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder-slate-500"
        />
      </div>

      <div className="flex overflow-x-auto pb-4 mb-2 gap-2 scrollbar-hide">
        {statusTabs.map(status => {
          const count = applications.filter(a => {
            if (selectedJob !== "All" && a.job_id !== selectedJob) return false;
            if (status === "New" && a.status !== "Applied") return false;
            else if (status === "Reviewing" && a.status !== "Under Review") return false;
            else if (status !== "All" && status !== "New" && status !== "Reviewing" && a.status !== status) return false;
            return true;
          }).length;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm transition-colors border ${statusFilter === status ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"}`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {filteredApps.length === 0 ? (
        <div className="text-center py-24 bg-slate-800/20 border border-dashed border-slate-700 rounded-3xl mt-4">
          <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-300 font-bold text-xl mb-2">
            {applications.length === 0 ? "No applicants yet" : "No applicants found"}
          </p>
          <p className="text-slate-500 font-medium">
            {applications.length === 0 ? "Applications from candidates will appear here when they apply to your jobs." : "Try changing your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {filteredApps.map((app) => {
            const config = getStatusConfig(app.status);
            const profile = app.profile;

            return (
              <div key={app.id} className="p-5 sm:p-6 bg-slate-800/40 border border-slate-700/50 shadow-lg rounded-2xl hover:shadow-xl hover:border-slate-600 transition-all flex flex-col group animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-slate-600 flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Applicant" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight group-hover:text-emerald-400 transition-colors">
                        {/* If there is a full name, split by space and take the first word. If not, show "New Applicant" */}
                        {profile.full_name ? profile.full_name.split(' ')[0] : "New Applicant"}
                      </h3>
                      <p className="text-slate-400 text-sm font-medium">{app.jobTitle}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm text-slate-300 font-medium">
                  {profile.location && (
                    <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-slate-500" /> {profile.location}</div>
                  )}
                  <div className="flex items-center"><Briefcase className="w-4 h-4 mr-2 text-slate-500" /> {app.expString}</div>
                  <div className="flex items-center sm:col-span-2"><Calendar className="w-4 h-4 mr-2 text-slate-500" /> Applied {new Date(app.applied_at).toLocaleDateString()}</div>
                </div>

                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.skills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-900/50 border border-slate-700 rounded-md text-xs font-medium text-slate-300">{skill}</span>
                    ))}
                    {profile.skills.length > 5 && (
                      <span className="px-2.5 py-1 bg-slate-900/50 border border-slate-700 rounded-md text-xs font-medium text-slate-400">+{profile.skills.length - 5}</span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-700/50 flex flex-wrap gap-2 sm:gap-3 items-center">
                  <button onClick={() => setSelectedApplicant(app)} className="px-4 py-2 text-sm font-bold text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex-1 text-center">View Profile</button>
                  {profile.resume_url && (
                    <a href={profile.resume_url} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-bold text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex items-center justify-center gap-2 flex-1">
                      <FileText className="w-4 h-4" /> Resume
                    </a>
                  )}
                  
                  {app.status === "Applied" && (
                    <button onClick={() => handleStatusChange(app.id, "Under Review")} disabled={updatingStatus} className="px-4 py-2 text-sm font-bold text-white bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg transition-colors flex-1">Review</button>
                  )}
                  {app.status === "Under Review" && (
                    <button onClick={() => handleStatusChange(app.id, "Shortlisted")} disabled={updatingStatus} className="px-4 py-2 text-sm font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors flex-1">Shortlist</button>
                  )}
                  {app.status === "Shortlisted" && (
                    <button onClick={() => handleStatusChange(app.id, "Interview")} disabled={updatingStatus} className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex-1">Schedule Interview</button>
                  )}
                  


                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:w-[480px] h-full bg-slate-900 border-l sm:border sm:rounded-2xl border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white">Applicant Profile</h2>
              <button onClick={() => setSelectedApplicant(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden mb-4 flex items-center justify-center shadow-lg">
                  {selectedApplicant.profile.avatar_url ? (
                    <img src={selectedApplicant.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-500" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-white">
                  {selectedApplicant.profile.full_name ? selectedApplicant.profile.full_name.split(' ')[0] : "New Applicant"}
                </h3>
                <p className="text-emerald-400 font-medium">{selectedApplicant.profile.professional_title || selectedApplicant.jobTitle}</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase ${getStatusConfig(selectedApplicant.status).color}`}>
                    {getStatusConfig(selectedApplicant.status).label}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Application Progress</h4>
                <div className="relative">
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-700"></div>
                  {["Applied", "Under Review", "Shortlisted", "Interview", "Selected"].map((step, idx) => {
                    const statuses = ["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"];
                    const currentIndex = statuses.indexOf(selectedApplicant.status);
                    const stepIndex = statuses.indexOf(step);
                    
                    let statusColor = "bg-slate-700 border-slate-600 text-slate-500";
                    let textColor = "text-slate-500";
                    let displayStep = step;

                    if (selectedApplicant.status === "Rejected") {
                       if (stepIndex <= currentIndex - 1) {
                         statusColor = "bg-emerald-500 border-emerald-400 text-slate-950";
                         textColor = "text-emerald-400";
                       } else if (step === "Selected") {
                         displayStep = "Rejected";
                         statusColor = "bg-rose-500 border-rose-400 text-slate-950";
                         textColor = "text-rose-400";
                       }
                    } else {
                      if (stepIndex < currentIndex) {
                        statusColor = "bg-emerald-500 border-emerald-400 text-slate-950";
                        textColor = "text-emerald-400";
                      } else if (stepIndex === currentIndex) {
                        statusColor = "bg-blue-500 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]";
                        textColor = "text-white font-bold";
                      }
                    }

                    return (
                      <div key={step} className="relative flex items-center gap-4 mb-4 last:mb-0 z-10">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${statusColor}`}>
                          {(stepIndex < currentIndex && selectedApplicant.status !== "Rejected") ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                        </div>
                        <span className={`text-sm ${textColor}`}>{displayStep}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Update Status</h4>
                 <div className="relative">
                   <select 
                     value={selectedApplicant.status}
                     onChange={(e) => handleStatusChange(selectedApplicant.id, e.target.value)}
                     disabled={updatingStatus}
                     className="w-full appearance-none px-4 py-3 bg-slate-900 border border-slate-600 text-white font-bold rounded-xl outline-none focus:border-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                   >
                     <option value="Applied">Applied (New)</option>
                     <option value="Under Review">Under Review</option>
                     <option value="Shortlisted">Shortlisted</option>
                     <option value="Interview">Interview</option>
                     <option value="Selected">Selected (Offer)</option>
                     <option value="Rejected">Rejected</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                 </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400 font-medium">Email</span>
                  <span className="text-white font-bold">{selectedApplicant.applicant_email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400 font-medium">Location</span>
                  <span className="text-white font-bold">{selectedApplicant.profile.location || "Not provided"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400 font-medium">Experience</span>
                  <span className="text-white font-bold">{selectedApplicant.expString}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400 font-medium">Applied On</span>
                  <span className="text-white font-bold">{new Date(selectedApplicant.applied_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Skills</h4>
                {selectedApplicant.profile.skills && selectedApplicant.profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.profile.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No skills provided.</p>
                )}
              </div>

              <div>
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Resume</h4>
                 {selectedApplicant.profile.resume_url ? (
                   <a href={selectedApplicant.profile.resume_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors group">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><FileText className="w-5 h-5" /></div>
                       <div className="overflow-hidden">
                         <p className="text-sm font-bold text-white truncate max-w-[200px]">{selectedApplicant.profile.resume_name || "Resume.pdf"}</p>
                         <p className="text-xs text-slate-400">View Document</p>
                       </div>
                     </div>
                     <span className="text-blue-400 font-bold text-sm group-hover:underline">Open</span>
                   </a>
                 ) : (
                   <div className="p-4 bg-slate-800/40 border border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium gap-2"><AlertCircle className="w-4 h-4" /> No resume uploaded</div>
                 )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
