import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import jobSeekeerSignUpImg from '../../assets/jobseeker_signup.png';
import adminSignUpImg from '../../assets/admin_signup.png';


export default function Register() {
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match!");
    }

    setLoading(true);
    setError('');

    const fullName = `${firstName} ${lastName}`;
    const { error: authError } = await authService.registerWithPassword(email, password, fullName, role);
    
    setLoading(false);
    if (authError) setError(authError.message);
    else navigate('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 py-8 bg-slate-950 text-slate-300">
      
      {/* Main Container */}
      <div className="flex w-full max-w-5xl overflow-hidden border shadow-2xl bg-slate-800/40 border-slate-700/50 backdrop-blur-xl rounded-3xl mt-5">
        
        {/* Left Side: Static Image (Hidden on Mobile) */}
        <div className="relative hidden lg:w-[45%] p-8 border-r lg:flex lg:flex-col lg:justify-center lg:items-center bg-slate-900/50 border-slate-700/50 overflow-hidden">
          {/* Animated Glow Orbs in Background */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* 3D Static Image (No Hover Effect) */}
          <div className="relative z-10 flex items-center justify-center w-full mb-6">
            <img 
              src={role === 'employee' ? jobSeekeerSignUpImg : adminSignUpImg} 
              alt="Join Us 3D" 
              className="w-full max-w-xs drop-shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300"
            />
          </div>
          
          {/* Text Content */}
          <div className={`relative z-10 w-full text-center ${role === 'employee' ? '-mt-2 mb-2' : '-mt-30 mb-12'}`}>
            
            {/* Dynamic Title */}
            <h2 className="mb-2 text-3xl font-bold leading-tight text-white">
              {role === 'employee' ? (
                <>Land Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Dream Job</span></>
              ) : (
                <>Hire Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Talent</span></>
              )}
            </h2>
            
            {/* Dynamic Subtitle */}
            <p className="text-sm text-slate-300">
              {role === 'employee' 
                ? "Discover opportunities, apply instantly, and track your career." 
                : "Post jobs, review applications, and build your dream team today."
              }
            </p>

          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-[55%] p-6 sm:p-8 lg:p-10">
          <h2 className="mb-4 text-2xl font-bold text-white lg:hidden">Let's Get Started</h2>
          <h2 className="hidden mb-4 text-2xl font-bold text-white lg:block">Sign Up</h2>
          
          {error && <div className="p-2 mb-3 text-sm border rounded-lg text-red-400 bg-red-500/10 border-red-500/20">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Role Selection */}
            <div className="flex p-1 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <button type="button" onClick={() => setRole('employee')} className={`flex-1 py-1.5 text-sm font-semibold transition-colors rounded-md ${role === 'employee' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                Job Seeker
              </button>
              <button type="button" onClick={() => setRole('employer')} className={`flex-1 py-1.5 text-sm font-semibold transition-colors rounded-md ${role === 'employer' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                Employer
              </button>
            </div>

            {/* Name Fields */}
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block mb-1 text-sm font-medium text-slate-300">First Name</label>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2.5 text-white transition border-b-2 outline-none bg-slate-900/30 border-slate-700/50 placeholder-slate-500 focus:bg-slate-900/60 focus:border-emerald-500 rounded-t-lg" placeholder="John" />
              </div>
              <div className="w-1/2">
                <label className="block mb-1 text-sm font-medium text-slate-300">Last Name</label>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 text-white transition border-b-2 outline-none bg-slate-900/30 border-slate-700/50 placeholder-slate-500 focus:bg-slate-900/60 focus:border-emerald-500 rounded-t-lg" placeholder="Doe" />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-300">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-white transition border-b-2 outline-none bg-slate-900/30 border-slate-700/50 placeholder-slate-500 focus:bg-slate-900/60 focus:border-emerald-500 rounded-t-lg" placeholder="you@example.com" />
            </div>

            {/* Password Field */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)}
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

            {/* Confirm Password Field */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} required minLength="6" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-white transition border-b-2 outline-none bg-slate-900/30 border-slate-700/50 placeholder-slate-500 focus:bg-slate-900/60 focus:border-emerald-500 rounded-t-lg" placeholder="••••••••" />
                
                {/* Notice the onClick now uses setShowConfirmPassword */}
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute text-slate-400 right-3 top-1/2 -translate-y-1/2 hover:text-emerald-400">
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 mt-2 font-bold transition-colors rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-400">
            Already have an account? <Link to="/login" className="font-medium transition-colors text-emerald-400 hover:text-emerald-300 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}