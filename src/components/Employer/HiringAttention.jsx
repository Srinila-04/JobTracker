import { Users, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function HiringAttention({ applications }) {
  const waitingReview = applications.filter(app => app.status === 'Applied').length;
  const shortlisted = applications.filter(app => app.status === 'Shortlisted').length;
  
  if (waitingReview === 0 && shortlisted === 0) {
    return (
      <div className="mb-8">
        <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-white">
          <AlertCircle className="text-emerald-400" />
          Needs Your Attention
        </h2>
        <div className="flex flex-col items-center justify-center p-8 text-center transition-all duration-300 border shadow-lg bg-emerald-900/10 border-emerald-500/20 rounded-2xl">
          <CheckCircle2 size={40} className="mb-3 text-emerald-400" />
          <h3 className="text-xl font-bold text-emerald-400">You're all caught up!</h3>
          <p className="mt-2 text-slate-400">No pending actions required at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-white">
        <AlertCircle className="text-yellow-400 animate-pulse" />
        Needs Your Attention
      </h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-5 p-6 transition-all duration-300 border shadow-md rounded-2xl bg-slate-800/60 border-slate-700 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] group cursor-default">
          <div className="p-4 transition-transform duration-300 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20">
            <Users size={28} />
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-white">{waitingReview}</span>
            <span className="text-sm font-medium text-slate-400">Candidates waiting for review</span>
          </div>
        </div>

        <div className="flex items-center gap-5 p-6 transition-all duration-300 border shadow-md rounded-2xl bg-slate-800/60 border-slate-700 hover:border-yellow-500/40 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(234,179,8,0.15)] group cursor-default">
          <div className="p-4 transition-transform duration-300 rounded-xl bg-yellow-500/10 text-yellow-400 group-hover:scale-110 group-hover:bg-yellow-500/20">
            <Calendar size={28} />
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-white">{shortlisted}</span>
            <span className="text-sm font-medium text-slate-400">Shortlisted candidates to process</span>
          </div>
        </div>
      </div>
    </div>
  );
}