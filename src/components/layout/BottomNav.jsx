import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = {
  student: [
    { icon: 'home', label: 'Home', path: '/student/dashboard' },
    { icon: 'leaderboard', label: 'Results', path: '/student/results' },
    { icon: 'assignment', label: 'Homework', path: '/student/homework' },
    { icon: 'chat', label: 'Chat', path: '/student/chat' },
    { icon: 'person', label: 'Profile', path: '/student/profile' },
  ],
  teacher: [
    { icon: 'home', label: 'Home', path: '/teacher/dashboard' },
    { icon: 'calendar_today', label: 'Attendance', path: '/teacher/attendance' },
    { icon: 'assignment', label: 'Homework', path: '/teacher/homework' },
    { icon: 'chat', label: 'Chat', path: '/teacher/chat' },
    { icon: 'person', label: 'Profile', path: '/teacher/profile' },
  ],
  admin: [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: 'group', label: 'Students', path: '/admin/students' },
    { icon: 'school', label: 'Teachers', path: '/admin/teachers' },
    { icon: 'campaign', label: 'Announce', path: '/admin/announcements' },
    { icon: 'settings', label: 'Settings', path: '/admin/settings' },
  ],
}

export default function BottomNav({ role = 'student' }) {
  const location = useLocation()
  const items = NAV_ITEMS[role] || NAV_ITEMS.student

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-surface-container-lowest shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)] rounded-t-xl pb-safe">
      {items.map(({ icon, label, path }) => {
        const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
        return (
          <NavLink
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center transition-all active:scale-90 px-3 py-1 rounded-full ${
              isActive
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon}
            </span>
            <span className="text-[10px] font-medium mt-0.5">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
