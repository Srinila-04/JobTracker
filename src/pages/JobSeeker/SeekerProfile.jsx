import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import Cropper from 'react-easy-crop';
import { 
  User, Mail, Phone, MapPin, Briefcase, FileText, 
  Upload, Trash2, Edit2, Plus, Save, Loader2, X, Camera
} from 'lucide-react';

export default function SeekerProfile() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Profile Data State
  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: '',
    location: '',
    professional_title: '',
    skills: [],
    avatar_url: null,
    resume_url: null,
    resume_name: null
  });

  const [experiences, setExperiences] = useState([]);
  const [expLoading, setExpLoading] = useState(true);

  // Modal States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expEditingId, setExpEditingId] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Fetch Profile & Experience
  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        // Fetch Profile
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (pData) {
          setProfile({
            full_name: pData.full_name || user?.user_metadata?.full_name || '',
            phone: pData.phone || '',
            location: pData.location || '',
            professional_title: pData.professional_title || '',
            skills: pData.skills || [],
            avatar_url: pData.avatar_url || null,
            resume_url: pData.resume_url || null,
            resume_name: pData.resume_name || null
          });
        }
        
        // Fetch Experience
        const { data: eData } = await supabase.from('experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
        if (eData) setExperiences(eData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setExpLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // Handle Save Personal Info
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      if (profile.full_name !== user?.user_metadata?.full_name) {
        await supabase.auth.updateUser({ data: { full_name: profile.full_name } });
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        professional_title: profile.professional_title,
        skills: profile.skills
      });

      if (error) throw error;
      
      setMessage({ text: "Profile updated successfully.", type: "success" });
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handle Resume Upload
  const handleResumeUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setMessage({ text: "Only PDF, DOC, and DOCX are allowed.", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setResumeUploading(true);
    try {
      const fileName = `${user.id}-${Date.now()}-${file.name}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);

      await supabase.from('profiles').upsert({ id: user.id, resume_url: publicUrl, resume_name: file.name });
      setProfile(prev => ({ ...prev, resume_url: publicUrl, resume_name: file.name }));
      
      setMessage({ text: "Resume uploaded successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: `Failed to upload resume: ${err.message}`, type: "error" });
    } finally {
      setResumeUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemoveResume = async () => {
    setResumeUploading(true);
    try {
      await supabase.from('profiles').upsert({ id: user.id, resume_url: null, resume_name: null });
      setProfile(prev => ({ ...prev, resume_url: null, resume_name: null }));
    } catch (err) {
      console.error(err);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: null });
      setProfile(prev => ({ ...prev, avatar_url: null }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-5rem)] p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-8">
        
        {message && (
          <div className={`p-4 rounded-xl border font-medium ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Profile Header (Photo) */}
        <div className="p-6 bg-slate-800/40 border border-slate-700/50 shadow-xl rounded-2xl flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group w-24 h-24 sm:w-32 sm:h-32 shrink-0">
            <div className="w-full h-full rounded-full bg-slate-700 border-4 border-slate-800 overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
              ) : (
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white mb-2">{profile.full_name || 'Your Profile'}</h1>
            <p className="text-slate-400 mb-4">{profile.professional_title || 'Update your professional title below'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <button 
                onClick={() => setIsPhotoModalOpen(true)}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-2 text-sm"
              >
                <Camera className="w-4 h-4" /> Change Photo
              </button>
              {profile.avatar_url && (
                <button 
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Personal Info & Resume */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Personal Information */}
            <form onSubmit={handleSaveProfile} className="p-6 bg-slate-800/40 border border-slate-700/50 shadow-xl rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-5 flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-400" /> Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                  <input type="text" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email (Read Only)</label>
                  <div className="flex items-center px-3 py-2.5 bg-slate-900/30 border border-slate-700/50 text-slate-400 rounded-lg">
                    <Mail className="w-4 h-4 mr-2" /> {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Professional Title</label>
                  <input type="text" placeholder="e.g. Frontend Developer" value={profile.professional_title} onChange={(e) => setProfile({...profile, professional_title: e.target.value})} className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                  <input type="text" placeholder="+1 234 567 890" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                  <input type="text" placeholder="e.g. New York, NY" value={profile.location} onChange={(e) => setProfile({...profile, location: e.target.value})} className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Skills</label>
                  <div className="flex gap-2 mb-3">
                    <input type="text" id="skillInput" onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !profile.skills.includes(val)) {
                          setProfile({...profile, skills: [...profile.skills, val]});
                          e.target.value = '';
                        }
                      }
                    }} placeholder="Add a skill and press Enter" className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none transition-colors" />
                    <button type="button" onClick={() => {
                        const input = document.getElementById('skillInput');
                        const val = input.value.trim();
                        if (val && !profile.skills.includes(val)) {
                          setProfile({...profile, skills: [...profile.skills, val]});
                          input.value = '';
                        }
                    }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors">Add</button>
                  </div>
                  {profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                      {profile.skills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium rounded-full flex items-center gap-2">
                          {skill}
                          <button type="button" onClick={() => setProfile({...profile, skills: profile.skills.filter(s => s !== skill)})} className="hover:text-emerald-300 transition-colors focus:outline-none"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" disabled={saving}
                className="mt-6 w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Details
              </button>
            </form>

            {/* Resume Section */}
            <div className="p-6 bg-slate-800/40 border border-slate-700/50 shadow-xl rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-5 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-400" /> Resume
              </h2>
              
              {profile.resume_url ? (
                <div className="p-4 border border-slate-700 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="w-6 h-6 text-blue-400" /></div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{profile.resume_name}</p>
                      <p className="text-xs text-slate-400">PDF / DOC</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a href={profile.resume_url} target="_blank" rel="noreferrer" className="w-full py-2 text-center text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">View Resume</a>
                    <div className="flex gap-2">
                      <label className="flex-1 py-2 text-center text-sm font-bold border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer">
                        {resumeUploading ? '...' : 'Replace'}
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={resumeUploading} />
                      </label>
                      <button onClick={handleRemoveResume} disabled={resumeUploading} className="flex-1 py-2 text-center text-sm font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl hover:border-emerald-400 hover:bg-emerald-400/5 cursor-pointer transition-colors">
                  {resumeUploading ? <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" /> : <Upload className="w-8 h-8 text-slate-400 mb-2" />}
                  <span className="text-sm font-bold text-slate-300">Upload Resume</span>
                  <span className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX</span>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={resumeUploading} />
                </label>
              )}
            </div>
          </div>

          {/* Right Column: Experience */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-slate-800/40 border border-slate-700/50 shadow-xl rounded-2xl h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-emerald-400" /> Experience
                </h2>
                <button 
                  onClick={() => { setExpEditingId('new'); setIsExpModalOpen(true); }}
                  className="px-3 py-1.5 text-sm font-bold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {expLoading ? (
                <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-slate-600" /></div>
              ) : experiences.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                  <Briefcase className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400 font-medium">No experience added yet</p>
                  <p className="text-sm text-slate-500 mt-1 mb-4">Add your work or internships here.</p>
                  <button onClick={() => { setExpEditingId('new'); setIsExpModalOpen(true); }} className="px-4 py-2 text-sm font-bold bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20">Add Experience</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="p-5 bg-slate-900/50 border border-slate-700 rounded-xl group relative hover:border-slate-600 transition-colors">
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => { setExpEditingId(exp.id); setIsExpModalOpen(true); }} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      </div>
                      <span className="inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded bg-slate-800 text-slate-300 mb-3">{exp.type}</span>
                      <h3 className="font-bold text-white text-lg">{exp.role}</h3>
                      <p className="text-emerald-400 font-medium text-sm mb-2">{exp.company}</p>
                      <p className="text-xs font-medium text-slate-400 mb-3 bg-slate-800 inline-block px-2 py-1 rounded">
                        {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                      </p>
                      {exp.description && <p className="text-sm text-slate-300 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {isPhotoModalOpen && (
        <PhotoUploadModal 
          onClose={() => setIsPhotoModalOpen(false)}
          onSave={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
          user={user}
        />
      )}
      
      {isExpModalOpen && (
        <ExperienceFormModal 
          onClose={() => setIsExpModalOpen(false)}
          user={user}
          editingId={expEditingId}
          experiences={experiences}
          setExperiences={setExperiences}
        />
      )}
    </div>
  );
}


// --- SUB COMPONENTS FOR MODALS ---

function PhotoUploadModal({ onClose, onSave, user }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        return setError("Only JPG, PNG, and WebP are allowed.");
      }
      setError(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const filePath = `${user.id}-${Math.random()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl });
      onSave(publicUrl);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Upload Photo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-500/10 rounded-lg">{error}</div>}
        
        {!imageSrc ? (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-xl hover:border-emerald-400 cursor-pointer text-slate-400 hover:text-emerald-400 transition-colors">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-sm font-bold">Select Image</span>
            <input type="file" className="hidden" accept="image/jpeg, image/png, image/jpg, image/webp" onChange={onFileChange} />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onCropComplete={(_, px) => setCroppedAreaPixels(px)} onZoomChange={setZoom} />
            </div>
            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-emerald-500" />
            <div className="flex gap-3">
              <button onClick={() => setImageSrc(null)} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 font-bold hover:bg-slate-800">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 flex justify-center">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExperienceFormModal({ onClose, user, editingId, experiences, setExperiences }) {
  const isNew = editingId === 'new';
  const existingExp = isNew ? null : experiences.find(e => e.id === editingId);
  
  const [form, setForm] = useState({
    type: existingExp?.type || 'Work',
    company: existingExp?.company || '',
    role: existingExp?.role || '',
    startMonth: existingExp?.start_date?.split('-')[1] || '',
    startYear: existingExp?.start_date?.split('-')[0] || '',
    endMonth: existingExp?.end_date?.split('-')[1] || '',
    endYear: existingExp?.end_date?.split('-')[0] || '',
    current: existingExp?.current || false,
    description: existingExp?.description || ''
  });
  
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!form.startMonth || !form.startYear || (!form.current && (!form.endMonth || !form.endYear))) {
      return setError("Please complete all date fields.");
    }
    
    setSaving(true);
    const payload = {
      user_id: user.id,
      type: form.type,
      company: form.company,
      role: form.role,
      start_date: `${form.startYear}-${form.startMonth}`,
      end_date: form.current ? null : `${form.endYear}-${form.endMonth}`,
      current: form.current,
      description: form.description
    };

    try {
      if (isNew) {
        const { data, error: err } = await supabase.from('experience').insert([payload]).select();
        if (err) throw err;
        if (data) setExperiences([data[0], ...experiences]);
      } else {
        const { data, error: err } = await supabase.from('experience').update(payload).eq('id', editingId).select();
        if (err) throw err;
        if (data) setExperiences(experiences.map(ex => ex.id === editingId ? data[0] : ex));
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    try {
      await supabase.from('experience').delete().eq('id', editingId);
      setExperiences(experiences.filter(ex => ex.id !== editingId));
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg p-6 bg-slate-900 border border-slate-700 rounded-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{isNew ? 'Add Experience' : 'Edit Experience'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-500/10 rounded-lg">{error}</div>}
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="type" value="Work" checked={form.type === 'Work'} onChange={(e) => setForm({...form, type: e.target.value})} className="hidden peer" />
              <div className="py-2 text-center text-sm font-medium border border-slate-700 rounded-lg peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border-emerald-500/50 text-slate-300">Work</div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="type" value="Internship" checked={form.type === 'Internship'} onChange={(e) => setForm({...form, type: e.target.value})} className="hidden peer" />
              <div className="py-2 text-center text-sm font-medium border border-slate-700 rounded-lg peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border-emerald-500/50 text-slate-300">Internship</div>
            </label>
          </div>
          
          <div><label className="block text-xs font-medium text-slate-400 mb-1">Role / Position</label><input required type="text" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none" /></div>
          <div><label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label><input required type="text" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none" /></div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
              <div className="flex gap-2">
                <select required value={form.startMonth} onChange={(e) => setForm({...form, startMonth: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none appearance-none"><option value="" disabled>Month</option>{['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{new Date(2000, parseInt(m)-1, 1).toLocaleString('default', { month: 'short' })}</option>)}</select>
                <select required value={form.startYear} onChange={(e) => setForm({...form, startYear: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none appearance-none"><option value="" disabled>Year</option>{Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
              <div className="flex gap-2">
                <select required={!form.current} disabled={form.current} value={form.current ? '' : form.endMonth} onChange={(e) => setForm({...form, endMonth: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none appearance-none disabled:opacity-50"><option value="" disabled>Month</option>{['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{new Date(2000, parseInt(m)-1, 1).toLocaleString('default', { month: 'short' })}</option>)}</select>
                <select required={!form.current} disabled={form.current} value={form.current ? '' : form.endYear} onChange={(e) => setForm({...form, endYear: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none appearance-none disabled:opacity-50"><option value="" disabled>Year</option>{Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.current} onChange={(e) => setForm({...form, current: e.target.checked})} className="w-4 h-4 accent-emerald-500" /><span className="text-sm text-slate-300">I currently work here</span></label>
          
          <div><label className="block text-xs font-medium text-slate-400 mb-1">Description</label><textarea rows="4" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-emerald-500 outline-none resize-none" placeholder="Describe your responsibilities..."></textarea></div>
          
          <div className="pt-4 flex gap-3">
            {!isNew && <button type="button" onClick={handleDelete} className="px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20"><Trash2 className="w-5 h-5" /></button>}
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 font-bold hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 flex justify-center items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
