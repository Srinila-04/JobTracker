import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut } from 'lucide-react';

export default function ProfileDropdown({ onLogoutClick }) {
  const { user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  // Fetch initial profile data (avatar)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setAvatarLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="relative" >
      {/* Avatar Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 hover:border-emerald-400 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        {avatarLoading ? (
          <div className="animate-pulse w-full h-full bg-slate-700"></div>
        ) : avatarUrl && !avatarError ? (
          <img 
            src={avatarUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <User className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-700/50 bg-slate-900/30">
            <p className="text-sm font-bold text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          
          <div className="p-2">
            <Link 
              to={user?.user_metadata?.role === 'employer' ? "/employer/profile" : "/seeker/profile"}
              onClick={() => setIsOpen(false)}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
            >
              <User className="w-4 h-4 mr-3 text-emerald-400" /> Profile
            </Link>
            
            <div className="h-px bg-slate-700/50 my-2 mx-2"></div>
            
            <button 
              onClick={() => {
                setIsOpen(false);
                onLogoutClick();
              }}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 mr-3" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
