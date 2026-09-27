import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // <-- Added database connection
import { useAuth } from '../../hooks/useAuth'; // <-- Added user authentication

export default function EmployerPostJob() {
  const navigate = useNavigate();
  const { user } = useAuth(); // <-- Get the currently logged-in employer

  // 1. Step Tracking State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // ── Toast Message State ──
  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (type, text) => {
    setToast({ type, text });
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 50);
    setTimeout(() => setToastVisible(false), 2000);
    setTimeout(() => setToast(null), 2300);
  };

  // 2. Form Data State
  const [formData, setFormData] = useState({
    companyName: '',
    title: '', category: '', type: 'Full-time', experienceLevel: 'Fresher', openings: 1, description: '',
    requiredSkills: '', qualifications: '', experienceRequired: '0-2 years', responsibilities: '', preferredSkills: '',
    salaryRange: '', salaryType: 'Annual', salaryNotDisclosed: false, benefits: '',
    workMode: 'On-site', country: '', state: '', city: '', officeLocation: '',
    applicationDeadline: '', applicationMethod: 'platform', applicationQuestions: '',
    department: '', shift: 'Day', workingHours: '', travelRequirement: 'None', jobTags: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // 3. UPDATED Submit Function to actually save to Supabase!
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // FIX: If we are not on the last step, pressing "Enter" will just go to the next step
    if (currentStep < totalSteps) {
      handleNext();
      return; 
    }

    if (!user) {
      showToast('error', "You must be logged in to post a job!");
      return;
    }

    try {
      // 1. Combine all the extra fields into a beautifully formatted text block
      const detailedRequirements = 
`[ Skills & Experience ]
• Required Skills: ${formData.requiredSkills || 'Not specified'}
• Preferred Skills: ${formData.preferredSkills || 'None'}
• Experience: ${formData.experienceLevel} (${formData.experienceRequired})
• Qualifications: ${formData.qualifications || 'Not specified'}

[ Key Responsibilities ]
${formData.responsibilities || 'Not specified'}

[ Perks & Benefits ]
${formData.benefits || 'Not specified'}

[ Work Details ]
• Department: ${formData.department || 'Not specified'}
• Shift & Hours: ${formData.shift} (${formData.workingHours || 'Standard'})
• Work Mode: ${formData.workMode}
• Travel Required: ${formData.travelRequirement || 'None'}
• Total Openings: ${formData.openings}`;

      // 2. Map the data to the database columns
      const newJob = {
        employer_id: user.id, 
        company: formData.companyName,
        title: formData.title,
        job_type: formData.type,
        location: formData.workMode === 'Remote' ? 'Remote' : `${formData.city}, ${formData.state}`,
        salary: formData.salaryNotDisclosed ? 'Not disclosed' : `${formData.salaryRange} (${formData.salaryType})`,
        description: formData.description,
        
        // Save our beautifully formatted string here!
        requirements: detailedRequirements
      };

      const { error } = await supabase.from('jobs').insert([newJob]);

      if (error) {
        console.error("Supabase Error:", error);
        showToast('error', `Failed to post job: ${error.message}`);
      } else {
        showToast('success', "Job posted successfully! 🎉");
        setTimeout(() => {
          navigate('/employer/jobs');
        }, 2000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      showToast('error', "An unexpected error occurred.");
    }
  };

  const inputStyles = "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-600";
  const labelStyles = "block text-sm font-medium text-slate-400 mb-1.5";

  // Sidebar Steps Data (matching the image layout)
  const steps = [
    { id: 1, title: 'Job Basic Details' },
    { id: 2, title: 'Skills & Requirements' },
    { id: 3, title: 'Salary & Benefits' },
    { id: 4, title: 'Job Location' },
    { id: 5, title: 'Application Details' },
    { id: 6, title: 'Additional Info' }
  ];

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  // Render Form Content Based on Current Step
  const renderStepContent = () => {
    // The key={currentStep} triggers the smooth slide-in animation every time the step changes!
    const wrapperClass = "space-y-6 animate-in fade-in slide-in-from-right-8 duration-500";

    switch (currentStep) {
      case 1:
        return (
          <div key={currentStep} className={wrapperClass}>
            <h2 className="text-2xl font-bold text-white mb-6">Tell us about the Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* --- ADD THIS NEW COMPANY NAME BLOCK --- */}
              <div className="md:col-span-2">
                <label className={labelStyles}>Company Name <span className="text-red-400">*</span></label>
                <input 
                  required 
                  type="text" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  placeholder="e.g. ABC Technologies" 
                  className={inputStyles} 
                />
              </div>
              {/* --------------------------------------- */}
              <div className="md:col-span-2">
                <label className={labelStyles}>Job Title <span className="text-red-400">*</span></label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Python Backend Developer" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Job Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputStyles}>
                  <option value="">Select Category...</option>
                  <option value="IT">IT / Software</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className={labelStyles}>Job Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className={inputStyles}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className={labelStyles}>Experience Level</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className={inputStyles}>
                  <option value="Fresher">Fresher</option>
                  <option value="Junior">Junior (1-3 yrs)</option>
                  <option value="Mid-level">Mid-level (3-5 yrs)</option>
                  <option value="Senior">Senior (5+ yrs)</option>
                </select>
              </div>
              <div>
                <label className={labelStyles}>Number of Openings</label>
                <input type="number" min="1" name="openings" value={formData.openings} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Job Description <span className="text-red-400">*</span></label>
                <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe the role and day-to-day tasks..." className={inputStyles}></textarea>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div key={currentStep} className={wrapperClass}>
            <h2 className="text-2xl font-bold text-white mb-6">Define the Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyles}>Required Skills <span className="text-red-400">*</span></label>
                <input required type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} placeholder="e.g. Python, Django, React, SQL" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Required Qualifications</label>
                <input type="text" name="qualifications" value={formData.qualifications} onChange={handleChange} placeholder="e.g. B.E/B.Tech, MCA" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Experience Required</label>
                <select name="experienceRequired" value={formData.experienceRequired} onChange={handleChange} className={inputStyles}>
                  <option value="0-2 years">0–2 years</option>
                  <option value="2-5 years">2–5 years</option>
                  <option value="5-8 years">5–8 years</option>
                  <option value="8+ years">8+ years</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Key Responsibilities *</label>
                <textarea required name="responsibilities" value={formData.responsibilities} onChange={handleChange} rows="3" placeholder="List the primary responsibilities..." className={inputStyles}></textarea>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Preferred Skills (Optional)</label>
                <input type="text" name="preferredSkills" value={formData.preferredSkills} onChange={handleChange} placeholder="e.g. Docker, AWS, Agile" className={inputStyles} />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div key={currentStep} className={wrapperClass}>
            <h2 className="text-2xl font-bold text-white mb-6">Set Salary & Benefits</h2>
            <div className="mb-6 flex items-center gap-3">
              <input type="checkbox" id="notDisclosed" name="salaryNotDisclosed" checked={formData.salaryNotDisclosed} onChange={handleChange} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
              <label htmlFor="notDisclosed" className="text-white font-medium cursor-pointer">Salary not disclosed</label>
            </div>
            {!formData.salaryNotDisclosed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelStyles}>Salary Range</label>
                  <input type="text" name="salaryRange" value={formData.salaryRange} onChange={handleChange} placeholder="e.g. ₹4 LPA – ₹7 LPA" className={inputStyles} />
                </div>
                <div>
                  <label className={labelStyles}>Salary Type</label>
                  <select name="salaryType" value={formData.salaryType} onChange={handleChange} className={inputStyles}>
                    <option value="Annual">Annual</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className={labelStyles}>Benefits (Optional)</label>
              <input type="text" name="benefits" value={formData.benefits} onChange={handleChange} placeholder="e.g. Health Insurance, PF, Paid Leave" className={inputStyles} />
            </div>
          </div>
        );
      case 4:
        return (
          <div key={currentStep} className={wrapperClass}>
            <h2 className="text-2xl font-bold text-white mb-6">Specify the Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyles}>Work Mode</label>
                <select name="workMode" value={formData.workMode} onChange={handleChange} className={inputStyles}>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              {formData.workMode !== 'Remote' && (
                <>
                  <div>
                    <label className={labelStyles}>Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="e.g. India" className={inputStyles} />
                  </div>
                  <div>
                    <label className={labelStyles}>State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Tamil Nadu" className={inputStyles} />
                  </div>
                  <div>
                    <label className={labelStyles}>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Chennai" className={inputStyles} />
                  </div>
                  <div>
                    <label className={labelStyles}>Office Location (Optional)</label>
                    <input type="text" name="officeLocation" value={formData.officeLocation} onChange={handleChange} placeholder="Tech Park, Building Name, etc." className={inputStyles} />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div key={currentStep} className={wrapperClass}>
            <h2 className="text-2xl font-bold text-white mb-6">Application Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Application Deadline</label>
                <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Application Method</label>
                <select name="applicationMethod" value={formData.applicationMethod} onChange={handleChange} className={inputStyles}>
                  <option value="platform">Apply through platform</option>
                  <option value="website">Company website</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Application Questions (Optional)</label>
                <textarea name="applicationQuestions" value={formData.applicationQuestions} onChange={handleChange} rows="3" placeholder='e.g. "How many years of React experience do you have?"' className={inputStyles}></textarea>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div key={currentStep} className={wrapperClass}>
            <h2 className="text-2xl font-bold text-white mb-6">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Department / Team</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Backend Engineering" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Shift</label>
                <select name="shift" value={formData.shift} onChange={handleChange} className={inputStyles}>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label className={labelStyles}>Working Hours</label>
                <input type="text" name="workingHours" value={formData.workingHours} onChange={handleChange} placeholder="e.g. 9:00 AM - 6:00 PM" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Travel Requirement</label>
                <select name="travelRequirement" value={formData.travelRequirement} onChange={handleChange} className={inputStyles}>
                  <option value="None">None</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Frequent">Frequent</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Job Tags</label>
                <input type="text" name="jobTags" value={formData.jobTags} onChange={handleChange} placeholder="e.g. Python, API, Backend (comma separated)" className={inputStyles} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-4 sm:p-8 flex items-center justify-center relative">
      
      {/* ── Smooth Toast Notification ── */}
      {toast && (
        <div
          style={{ transition: 'all 0.3s ease' }}
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm
            ${toast.type === 'success' ? 'bg-slate-800 border-emerald-500/40' : 'bg-slate-800 border-rose-500/40'}
            ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}
          `}
        >
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {toast.text}
          </p>
        </div>
      )}

      {/* 
        MAIN CONTAINER 
        This replicates the image's unified card structure 
      */}
      <div className="max-w-5xl w-full flex flex-col md:flex-row bg-slate-900 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* LEFT SIDEBAR (Darker background with vertical steps) */}
        <div className="hidden md:flex flex-col justify-center w-72 bg-slate-950 p-8 relative">
          <div className="space-y-12 relative z-10">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="relative flex items-center justify-end">
                  {/* Step Text on the Left */}
                  <span className={`text-right pr-8 font-medium text-sm transition-colors duration-300 ${
                    isActive ? 'text-emerald-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                  
                  {/* Overlapping Circle (like the image) */}
                  <div className={`absolute -right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                    isActive 
                      ? 'bg-slate-950 border-2 border-emerald-400 text-emerald-400 scale-110 shadow-[0_0_15px_rgba(52,211,153,0.4)]' 
                      : isCompleted 
                        ? 'bg-emerald-500 text-white border border-emerald-500'
                        : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile top step indicator (Shown only on small screens) */}
        <div className="md:hidden bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
           <span className="text-emerald-400 font-medium">Step {currentStep} of 6</span>
           <span className="text-slate-300 text-sm">{steps[currentStep-1].title}</span>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 p-8 md:p-12 flex flex-col bg-slate-900 relative">
          
          {/* Close Button at top right */}
          <div className="absolute top-6 right-6">
             <Link to="/employer/jobs" className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-6 h-6" />
             </Link>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="flex flex-col h-full min-h-[450px]"
            // FIX: This stops the Enter key from accidentally submitting the form early!
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          >
            
            {/* Form Body Area */}
            <div className="flex-1 mt-4 relative">
               {renderStepContent()}
            </div>

            {/* Bottom Progress Bar & Navigation (matching the image) */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6">
              
              {/* Progress Line */}
              <div className="flex items-center gap-4 w-full sm:w-1/2">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-700 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-slate-500 w-12">{Math.round(progressPercentage)}% Left</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                 <button 
                    type="button" 
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      currentStep === 1 
                        ? 'opacity-0 pointer-events-none' 
                        : 'text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    ← PREVIOUS
                  </button>

                  {currentStep < totalSteps ? (
                    <button 
                      type="button" 
                      onClick={handleNext}
                      className="px-8 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      NEXT →
                    </button>
                                    ) : (
                    <button 
                      type="button" 
                      onClick={handleSubmit}
                      className="px-8 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      PUBLISH JOB
                    </button>
                  )}
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
