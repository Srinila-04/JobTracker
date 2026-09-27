import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import loginVideo from '../../assets/login_video.webm';

export default function Login() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loginMethod, setLoginMethod] = useState('password'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    
    // 1. Try to log them in
    const { data, error: authError } = await authService.loginWithPassword(email, password);
    
    if (authError) {
      setLoading(false);
      return setError(authError.message);
    }

    // 2. Check their actual role in the database
    const dbRole = data.user?.user_metadata?.role;
    
    if (dbRole !== role) {
      // 3. If they clicked the wrong tab, kick them out!
      await authService.logout(); 
      setLoading(false);
      return setError("Access Denied: Please select the correct tab for your account type.");
    }

    // 4. Send them to their specific dashboard
    setLoading(false);
    if (role === 'employer') {
      navigate('/employer-dashboard');
    } else {
      navigate('/seeker-dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 py-8 bg-slate-950 text-slate-300">
      
      <div className="flex w-full max-w-5xl overflow-hidden border shadow-2xl bg-slate-800/40 border-slate-700/50 backdrop-blur-xl rounded-3xl mt-16">
        
        {/* Left Side: Static Image (Hidden on Mobile) */}
        <div className="relative hidden lg:w-[45%] p-8 border-r lg:flex lg:flex-col lg:justify-center lg:items-center bg-slate-900/50 border-slate-700/50 overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
            <div className="relative z-10 flex items-center justify-center w-full mb-6">
              <video 
                src={loginVideo} 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full max-w-full drop-shadow-[0_0_30px_rgba(16,185,129,0.2)] rounded-2xl"
              />
          </div>
          
          <div className="relative z-10 w-full text-center">
            <h2 className="mb-2 text-3xl font-bold leading-tight text-white">
              
              Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Back</span>
            </h2>
            <p className="text-sm text-slate-300">
              Sign in to continue your journey and unlock new opportunities.
            </p>
          </div>
        </div>

        {/* Right Side: Form (No vertical scroll) */}
        <div className="w-full lg:w-[55%] p-6 sm:p-8 lg:p-10">
          <h2 className="mb-4 text-2xl font-bold text-white lg:hidden">Welcome Back</h2>
          <h2 className="hidden mb-4 text-2xl font-bold text-white lg:block">Sign In</h2>
          
          {error && <div className="p-2 mb-3 text-sm border rounded-lg text-red-400 bg-red-500/10 border-red-500/20">{error}</div>}

          {/* Role Selection */}
          <div className="flex p-1 mb-6 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <button type="button" onClick={() => setRole('employee')} className={`flex-1 py-1.5 text-sm font-semibold transition-colors rounded-md ${role === 'employee' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
              Job Seeker
            </button>
            <button type="button" onClick={() => setRole('employer')} className={`flex-1 py-1.5 text-sm font-semibold transition-colors rounded-md ${role === 'employer' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
              Employer
            </button>
          </div>

          {/* PASSWORD LOGIN */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-white transition border-b-2 outline-none bg-slate-900/30 border-slate-700/50 placeholder-slate-500 focus:bg-slate-900/60 focus:border-emerald-500 rounded-t-lg" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-white transition border-b-2 outline-none bg-slate-900/30 border-slate-700/50 placeholder-slate-500 focus:bg-slate-900/60 focus:border-emerald-500 rounded-t-lg" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute text-slate-400 right-3 top-1/2 -translate-y-1/2 hover:text-emerald-400">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-2.5 mt-2 font-bold transition-colors rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-center text-slate-400">
            Don't have an account? <Link to="/register" className="font-medium transition-colors text-emerald-400 hover:text-emerald-300 hover:underline">Sign up here</Link>
          </p>
        </div>
      </div>

    </div>
  );
}