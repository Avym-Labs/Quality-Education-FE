import { useNavigate } from 'react-router-dom'

export default function PausedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-[32px] p-8 shadow-2xl border border-outline-variant/30 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 text-error flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-3xl">pause_circle</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-headline-md font-bold text-on-surface">Account Paused</h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your account or institution has been temporarily paused by EduCore administration.
          </p>
        </div>

        <div className="p-4 bg-error-container/20 rounded-2xl border border-error/10 text-left text-xs text-error font-semibold flex items-start gap-2.5">
          <span className="material-symbols-outlined text-sm mt-0.5">info</span>
          <div>
            <p className="font-bold">Next Steps:</p>
            <p className="opacity-90 mt-0.5">Please contact the EduCore support desk or email administration to resolve this issue and restore immediate classroom access.</p>
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Return to Sign In</span>
          </button>
        </div>
      </main>
    </div>
  )
}
