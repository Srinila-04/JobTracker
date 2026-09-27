import { useAuth } from '../../hooks/useAuth';
import adminImg from '../../assets/admin_dashboard.png';

export default function WelcomeHeader() {
  const { user } = useAuth();
  
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Employer';
  const firstName = fullName.split(' ')[0];

  return (
    <div className="relative flex items-center justify-between p-8 mb-8 overflow-hidden transition-all duration-500 border shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 rounded-2xl group hover:border-emerald-500/30 hover:shadow-emerald-900/20">
      
      <div className="relative z-10 animate-fade-in-up">
        
        {/* --- TRUE MAGNIFYING GLASS ANIMATION --- */}
        <div className="relative inline-block py-2 welcome-wrapper">
          
          {/* Layer 1: Normal Base Text */}
          <h1 className="text-3xl font-bold text-white md:text-4xl whitespace-nowrap">
            Welcome back, <span className="capitalize text-emerald-400">{firstName}</span>
          </h1>

          {/* Layer 2: Physically Enlarged Text (Clipped perfectly to the Lens) */}
          <h1 className="absolute top-0 left-0 w-full py-2 text-3xl font-bold text-white md:text-4xl magnified-text whitespace-nowrap" aria-hidden="true">
            Welcome back, <span className="capitalize text-emerald-400">{firstName}</span>
          </h1>

          {/* Layer 3: The physical glass design */}
          <div className="magnifying-glass">
            <div className="glass-lens" />
            <div className="glass-handle" />
          </div>

        </div>

        <p className="max-w-md mt-6 text-lg text-slate-400">
          Manage your job postings, track performance, and connect with top candidates.
        </p>
      </div>

      <div className="hidden relative z-10 w-48 h-48 md:block animate-float">
        {/* Keep your image src here! */}
        <img 
          src={adminImg} 
          alt="Dashboard Illustration" 
          className="object-contain w-full h-full opacity-90 drop-shadow-2xl"
        />
      </div>

      {/* Animated Drifting Background Glows */}
      <div className="absolute top-0 left-10 w-72 h-72 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[60px] opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-10 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-screen filter blur-[60px] opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-10 left-1/2 w-72 h-72 bg-emerald-300/10 rounded-full mix-blend-screen filter blur-[60px] opacity-70 animate-blob animation-delay-4000"></div>

      {/* --- CSS FOR MAGNIFIER EFFECT --- */}
      <style>{`
        .welcome-wrapper {
          position: relative;
          display: inline-block;
          margin-top: 10px;
          margin-bottom: 10px;
          padding-right: 40px; /* Gives the glass room to sweep past the text */
        }
        
        /* The zoomed text layer */
        .magnified-text {
          /* Hides the small letters beneath the glass */
          background-color: #1e293b; 
          
          /* Scales the text physically by 1.6x */
          transform: scale(1.6);
          pointer-events: none;
          z-index: 5;
          animation: sweepText 5s infinite alternate ease-in-out;
          -webkit-font-smoothing: antialiased;
        }

        /* The magnifying glass container */
        .magnifying-glass {
          position: absolute;
          top: 50%;
          transform: translateY(-50%) translateX(-50%);
          z-index: 10;
          pointer-events: none;
          animation: sweepLens 5s infinite alternate ease-in-out;
        }

        /* The physical glass circle */
        .glass-lens {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 6px solid #1e293b; /* Sleek dark rim */
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 
            inset 0 0 15px rgba(255,255,255,0.15), 
            0 10px 25px rgba(0,0,0,0.6);
          backdrop-filter: blur(1px);
          position: relative;
        }

        /* The glare/reflection on the glass */
        .glass-lens::after {
          content: '';
          position: absolute;
          top: 8px;
          left: 12px;
          width: 28px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          transform: rotate(-30deg);
        }

        /* The handle of the glass */
        .glass-handle {
          position: absolute;
          top: 76px;
          left: 76px;
          width: 45px;
          height: 16px;
          background: linear-gradient(to bottom, #94a3b8, #475569);
          border-radius: 8px;
          transform: rotate(45deg);
          transform-origin: top left;
          box-shadow: 3px 3px 6px rgba(0,0,0,0.5);
        }

        /* Mathematical alignment for the clip path */
        @keyframes sweepText {
          0%, 5% {
            transform-origin: -15% 50%;
            clip-path: circle(24.3px at -15% 50%);
          }
          95%, 100% {
            transform-origin: 90% 50%;
            clip-path: circle(24.3px at 90% 50%);
          }
        }

        /* Syncs the physical glass movement */
        @keyframes sweepLens {
          0%, 5% { left: -15%; }
          95%, 100% { left: 90%; }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s forwards;
        }
        
        /* Floating Image Animation */
        @keyframes floatImage {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: floatImage 5s ease-in-out infinite;
        }

        /* Smooth drifting animation for the background glows */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -50px) scale(1.1); }
          66% { transform: translate(-30px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 8s infinite alternate ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}