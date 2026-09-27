import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { LogOut, Menu, X, MessageSquare } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

const AnimatedLogo = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 overflow-visible">
    <style>
      {`
        @keyframes searchScan {
          0% { transform: translate(8px, -6px) rotate(0deg); }
          35% { transform: translate(-12px, 14px) rotate(-12deg); }
          65% { transform: translate(8px, 22px) rotate(8deg); }
          100% { transform: translate(8px, -6px) rotate(0deg); }
        }
        .anim-scan {
          animation: searchScan 4s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
      `}
    </style>
    
    <rect x="14" y="6" width="36" height="52" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="3" />
    <rect x="22" y="14" width="12" height="12" rx="2" fill="#334155" />
    <path d="M38 16h8 M38 22h6 M22 34h20 M22 42h16 M22 50h12" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
    
    <g className="anim-scan">
      <line x1="42" y1="42" x2="31" y2="31" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 60 L 41 45 C 39 42, 42 39, 45 41 L 52 50 Z" fill="#64748b" />
      <path d="M38 41 C 36 39, 39 36, 42 39" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 43 C 38 41, 41 38, 44 41" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="11" fill="#020617" fillOpacity="0.7" stroke="#34d399" strokeWidth="3" />
      <circle cx="24" cy="24" r="9" fill="#10b981" fillOpacity="0.15" />
    </g>
  </svg>
);

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false);
      setUnreadMessageCount(count || 0);
    };
    fetchUnread();
    const channelName = `global-notifs-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
        setGlobalMessage(payload.new);
        setUnreadMessageCount(prev => prev + 1);
        setTimeout(() => setGlobalMessage(null), 5000);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
        if (payload.new.is_read) fetchUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await authService.logout();
    navigate('/login');
  };

  if (!user) return null;

  const role = user?.user_metadata?.role;
  const isEmployer = role === 'employer';
  const isJobSeeker = !isEmployer; 

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
    return (
      <Link 
        to={to} 
        draggable="false"
        className={`font-medium transition-colors ${isActive ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'text-slate-300 hover:text-emerald-400'}`}
      >
        {children}
      </Link>
    );
  };

  const MobileNavLink = ({ to, children }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
    return (
      <Link 
        to={to} 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
          isActive 
            ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400 border-l-4 border-transparent'
        }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      {globalMessage && (
        <div className="fixed top-24 right-4 z-[100] flex items-center gap-4 px-5 py-4 bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-[0_10px_40px_-10px_rgba(52,211,153,0.3)] animate-in slide-in-from-top-4 max-w-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-white text-sm font-bold">New Message</h4>
            <p className="text-slate-300 text-xs mt-1 line-clamp-1">{globalMessage.content}</p>
          </div>
          <button onClick={() => setGlobalMessage(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to="/" draggable="false" className="flex items-center gap-2 text-2xl font-bold text-white tracking-wide">
                <AnimatedLogo /> JobTracker
              </Link>
            </div>

            {isJobSeeker && (
              <div className="hidden space-x-8 md:flex">
                <NavLink to="/seeker/dashboard">Dashboard</NavLink>
                <NavLink to="/seeker/jobs">Find Jobs</NavLink>
                <NavLink to="/seeker/saved-jobs">Saved Jobs</NavLink>
                <NavLink to="/seeker/applications">Applications</NavLink>
              </div>
            )}

            {isEmployer && (
              <div className="hidden space-x-8 md:flex">
                <NavLink to="/employer/dashboard">Dashboard</NavLink>
                <NavLink to="/employer/jobs">Manage Jobs</NavLink>
                <NavLink to="/employer/applicants">Applicants</NavLink>
              </div>
            )}

            <div className="hidden md:flex items-center space-x-6">
              <ProfileDropdown onLogoutClick={() => setIsLogoutModalOpen(true)} />
            </div>

            <div className="flex md:hidden items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-300 hover:text-white transition-colors p-2"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 absolute w-full left-0 shadow-2xl pb-4">
            <div className="px-3 pt-3 pb-4 space-y-1 sm:px-4">
              {isJobSeeker && (
                <>
                  <MobileNavLink to="/seeker/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink to="/seeker/jobs">Find Jobs</MobileNavLink>
                  <MobileNavLink to="/seeker/saved-jobs">Saved Jobs</MobileNavLink>
                  <MobileNavLink to="/seeker/applications">Applications</MobileNavLink>
                </>
              )}
              
              {isEmployer && (
                <>
                  <MobileNavLink to="/employer/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink to="/employer/jobs">Manage Jobs</MobileNavLink>
                  <MobileNavLink to="/employer/applicants">Applicants</MobileNavLink>
                </>
              )}

              <div className="border-t border-slate-800 my-2 pt-2">
                <MobileNavLink to={isEmployer ? "/employer/profile" : "/seeker/profile"}>Profile</MobileNavLink>
                
                <button                 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }} 
                  className="w-full text-left block px-4 py-3 mt-1 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 border-l-4 border-transparent transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {isLogoutModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsLogoutModalOpen(false)}
          >
            <div 
              className="w-full max-w-sm p-6 bg-slate-800 border border-slate-700/50 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-full text-red-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Log out?</h3>
              </div>
              
              <p className="mb-6 text-sm text-slate-300">
                Are you sure you want to log out? You will need to sign in again to access your dashboard.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)} 
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLogout} 
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <Link
        to="/messages"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 text-slate-900 rounded-full shadow-lg hover:bg-emerald-400 hover:scale-105 transition-transform"
        title="Messages"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadMessageCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-900">
            {unreadMessageCount}
          </span>
        )}
      </Link>
    </>
  );
}