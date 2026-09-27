import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save, Check } from 'lucide-react';

export default function EmployerEditJob() {
  const { id } = useParams(); // Gets the Job ID from the URL
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', job_type: '', location: '', salary: '', description: '', requirements: ''
  });

    // 1. Toast State
  const [toast, setToast] = useState({ mounted: false, visible: false, message: '' });
  
  // 2. Function to trigger the toast with smooth animations
  const showToast = (message) => {
    // Step A: Put it in the HTML (but hidden off-screen to the right)
    setToast({ mounted: true, visible: false, message });
    
    // Step B: Slide it IN after a tiny split-second delay
    setTimeout(() => setToast({ mounted: true, visible: true, message }), 50);

    // Step C: Slide it OUT to the right after 2.5 seconds
    setTimeout(() => setToast({ mounted: true, visible: false, message }), 2500);

    // Step D: Completely delete it from the HTML after 3 seconds
    setTimeout(() => setToast({ mounted: false, visible: false, message: '' }), 3000);
  };

  // Fetch the current job details when the page loads
  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (data) {
        setFormData({
          title: data.title || '',
          job_type: data.job_type || '',
          location: data.location || '',
          salary: data.salary || '',
          description: data.description || '',
          requirements: data.requirements || ''
        });
      }
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Update the database when clicked
  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('jobs').update(formData).eq('id', id);
    
    if (!error) {
      // 1. Show our beautiful new toast!
      showToast("Job updated successfully!");
      
      // 2. Wait 1.5 seconds so the user can see the toast before we navigate away
      setTimeout(() => {
        navigate('/employer/jobs');
      }, 3000);
      
    } else {
      alert("Error updating job: " + error.message);
    }
  };
  

  const inputStyles = "w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
  const labelStyles = "block text-sm font-medium text-slate-300 mb-1.5";

  if (loading) return <div className="p-8 text-center text-slate-400">Loading job details...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/employer/jobs" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg"><ArrowLeft className="w-5 h-5"/></Link>
        <h1 className="text-3xl font-bold text-white">Edit Job</h1>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6 bg-slate-800/40 p-6 md:p-8 border border-slate-700/50 rounded-2xl shadow-xl backdrop-blur-xl">
        <div>
          <label className={labelStyles}>Job Title</label>
          <input required type="text" name="title" value={formData.title} onChange={handleChange} className={inputStyles} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyles}>Job Type</label>
            <select name="job_type" value={formData.job_type} onChange={handleChange} className={inputStyles}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className={labelStyles}>Location</label>
            <input required type="text" name="location" value={formData.location} onChange={handleChange} className={inputStyles} />
          </div>
        </div>

        <div>
          <label className={labelStyles}>Salary</label>
          <input required type="text" name="salary" value={formData.salary} onChange={handleChange} className={inputStyles} />
        </div>

        <div>
          <label className={labelStyles}>Description</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className={inputStyles}></textarea>
        </div>

        <div>
          <label className={labelStyles}>Requirements</label>
          <textarea required name="requirements" value={formData.requirements} onChange={handleChange} rows="4" className={inputStyles}></textarea>
        </div>

        <button type="submit" className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/25 mt-4">
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </form>

            {/* --- Beautiful Top-Right Toast Notification --- */}
      {toast.mounted && (
        <div 
          className={`fixed top-24 right-8 z-50 transition-all duration-500 ease-in-out ${
            toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
          }`}
        >
          <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500 shadow-2xl rounded-xl border border-emerald-400">
            <Check className="w-6 h-6 text-white" /> 
            <p className="text-white font-bold text-lg">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
 