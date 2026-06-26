import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function TopBar({ onNotificationClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'student'

  return (
    <header className="w-full top-0 sticky z-40 bg-surface flex justify-between items-center px-container-padding-mobile py-stack-sm shadow-sm">
      <div className="flex items-center gap-stack-sm">
        <div
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed shadow-sm cursor-pointer"
          onClick={() => navigate(`/${role}/profile`)}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.first_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary-fixed flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
          )}
        </div>
        <h1 className="text-headline-lg-mobile font-bold text-primary tracking-tight">EduCore</h1>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNotificationClick ? onNotificationClick() : navigate(`/${role}/notifications`)}
          className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95"
        >
          notifications
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              logout()
              navigate('/login')
            }
          }}
          className="material-symbols-outlined text-error hover:bg-red-50 transition-colors p-2 rounded-full active:scale-95"
          title="Sign Out"
        >
          logout
        </button>
      </div>
    </header>
  )
}
