import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  User, Mail, Phone, MapPin, Building2,
  Globe, Briefcase, Save, Loader2, Camera, Users, FileText
} from 'lucide-react';

export default function EmployerProfile() {
  // Get the currently logged-in user
  const { user } = useAuth();

  // loading = true while we fetch data from the database
  const [loading, setLoading] = useState(true);
  // saving = true while we are sending updated data to the database
  const [saving, setSaving] = useState(false);
  // message = success or error message shown after saving
    // toast stores: { type: 'success' | 'error', text: 'message here' }
  const [toast, setToast] = useState(null);
  // toastVisible controls the slide-in / slide-out CSS transition
  const [toastVisible, setToastVisible] = useState(false);

  // Call this function anywhere to show a toast
  const showToast = (type, text) => {
    setToast({ type, text });       // 1. set the message content
    setToastVisible(false);         // 2. start hidden (so it can animate IN)

    // Small delay so React renders the hidden element first
    setTimeout(() => setToastVisible(true), 50);

    // After 3 seconds → slide it out
    setTimeout(() => setToastVisible(false), 3000);

    // After slide-out animation (300ms) → remove from DOM completely
    setTimeout(() => setToast(null), 3350);
  };

  // This object holds all the profile field values
  // Each key matches a column name in the 'profiles' table
  const [profile, setProfile] = useState({
    full_name: '',           // employer's own name
    company_name: '',        // company name
    phone: '',               // contact phone
    location: '',            // city / country
    company_website: '',     // e.g. https://mycompany.com
    industry: '',            // e.g. Technology, Healthcare
    bio: '',                 // company description
    avatar_url: null,        // profile photo URL
  });

  // photoUploading = true while profile photo is being uploaded
  const [photoUploading, setPhotoUploading] = useState(false);

  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  // ── STEP 1: Load existing profile data when the page opens ──
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);

      // Fetch this employer's row from the 'profiles' table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)   // only get MY row
        .maybeSingle();      // returns one object or null (no error if not found)

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        // Fill in the form fields with the saved data
        setProfile({
          full_name:       data.full_name        || user?.user_metadata?.full_name || '',
          company_name:    data.company_name     || '',
          phone:           data.phone            || '',
          location:        data.location         || '',
          company_website: data.company_website  || '',
          industry:        data.industry         || '',
          bio:             data.bio              || '',
          avatar_url:      data.avatar_url       || null,
        });
        const presetOptions = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-Commerce', 'Manufacturing', 'Marketing', 'Consulting', 'Media'];
        if (data.industry && !presetOptions.includes(data.industry)) {
          setShowCustomIndustry(true);
        }
      }
      

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // ── STEP 2: Update a single field in the profile state ──
  // Called every time the user types in any input field
  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,        // keep all other fields the same
      [field]: value  // only update the field that changed
    }));
  };

  // ── STEP 3: Save all profile changes to Supabase ──
  const handleSave = async (e) => {
    e.preventDefault(); // prevent the page from refreshing
    setSaving(true);

    // Update Auth User Metadata so it reflects everywhere (Navbar, Dashboard)
    if (profile.full_name !== user?.user_metadata?.full_name) {
      await supabase.auth.updateUser({ data: { full_name: profile.full_name } });
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({                      // upsert = insert if not exists, update if exists
        id:              user.id,    // this is the primary key
        full_name:       profile.full_name,
        company_name:    profile.company_name,
        phone:           profile.phone,
        location:        profile.location,
        company_website: profile.company_website,
        industry:        profile.industry,
        bio:             profile.bio,
        avatar_url:      profile.avatar_url,
      });

    setSaving(false);

    if (error) {
      console.error('Error saving profile:', error);
      showToast('error', 'Failed to save. Please try again.');
    } else {
      showToast('success', 'Profile saved successfully!');
    }
  };

  // ── STEP 4: Upload a new profile photo ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; // get the selected file
    if (!file) return;

    // Only allow image files
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setPhotoUploading(true);

    // Create a unique filename using the user's ID + current timestamp
        const fileName = `employer_${user.id}_${Date.now()}.${file.name.split('.').pop()}`;
    // ✅ No 'avatars/' prefix — the bucket itself is named 'avatars'
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('avatars')    // ✅ correct bucket name
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload photo.');
      setPhotoUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')    
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Save the URL to the database immediately
    await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: publicUrl });

    // Update the photo shown on the page
    setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
    setPhotoUploading(false);
  };

  // Show a spinner while data is loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Company Profile</h1>
        <p className="text-slate-400 font-medium">
          Manage your company information and how it appears to job seekers.
        </p>
      </div>


              {/* ── Smooth Toast Notification ── */}
      {/* Only renders when there is a toast message */}
      {toast && (
        <div
          style={{ transition: 'all 0.3s ease' }}
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm
            ${toast.type === 'success'
              ? 'bg-slate-800 border-emerald-500/40'
              : 'bg-slate-800 border-rose-500/40'
            }
            ${toastVisible
              ? 'opacity-100 translate-y-0'   // visible: slide down into view
              : 'opacity-0 -translate-y-3'     // hidden: slide up out of view
            }
          `}
        >
          {/* Colored circle dot on the left */}
          <div className={`w-2.5 h-2.5 rounded-full shrink-0
            ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}
          `} />

          {/* Message text */}
          <p className={`text-sm font-medium
            ${toast.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}
          `}>
            {toast.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6"></form>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Profile Photo Card ── */}
        <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Profile Photo</h2>

          <div className="flex items-center gap-6">
            {/* Photo preview circle */}
            <div className="relative w-24 h-24 shrink-0">
              <div className="w-24 h-24 rounded-full bg-slate-700 border-4 border-slate-600 overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-500" />
                )}
              </div>

              {/* Camera icon overlay */}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-400 transition-colors border-2 border-slate-900">
                {photoUploading ? (
                  <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-slate-950" />
                )}
                {/* Hidden file input — clicking the label triggers this */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                />
              </label>
            </div>

            <div>
              <p className="text-white font-bold text-lg">
                {profile.full_name || 'Your Name'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {profile.company_name || 'Your Company'}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Click the camera icon to upload a new photo
              </p>
            </div>
          </div>
        </div>

        {/* ── Personal Information Card ── */}
        <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Personal Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Your Name */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Your Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="e.g. Srinila R"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            {/* Email (read-only — comes from auth) */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/30 border border-slate-700/50 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">Email cannot be changed here</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Chennai, India"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-500 text-sm"
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Company Information Card ── */}
        <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Company Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Company Name */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="e.g. ABC Technologies"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Company Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={profile.company_website}
                  onChange={(e) => handleChange('company_website', e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Industry
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  value={showCustomIndustry ? 'Other' : profile.industry}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      // Show the custom text box and clear the saved industry
                      setShowCustomIndustry(true);
                      handleChange('industry', '');
                    } else {
                      // Hide the text box and save the selected value
                      setShowCustomIndustry(false);
                      handleChange('industry', e.target.value);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Media">Media & Entertainment</option>
                  <option value="Other">Other (type your own)</option>
                </select>
              </div>

              {/* This text box only appears when "Other" is selected */}
              {showCustomIndustry && (
                <input
                  type="text"
                  value={profile.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  placeholder="e.g. Logistics, Agriculture, Real Estate..."
                  autoFocus
                  className="mt-3 w-full px-4 py-3 bg-slate-900/50 border border-emerald-500/50 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-500 text-sm"
                />
              )}
            </div>
          </div>

          {/* Company Description — full width */}
          <div className="mt-5">
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Company Description
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              placeholder="Tell job seekers about your company culture, mission, and what makes you a great place to work..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-500 text-sm resize-none"
            />
          </div>
        </div>

        {/* ── Save Button ── */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Profile
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

