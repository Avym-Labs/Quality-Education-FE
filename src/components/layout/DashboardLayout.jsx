import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { useAuth } from '../../context/AuthContext'

// Shared submenu shown under "Academics" for every role, mirrors the tabs inside AcademicsHub
const ACADEMICS_SUBITEMS = [
  { icon: 'library_books', label: 'Study Material', tab: 'material' },
  { icon: 'quiz', label: 'Tests & Answer Keys', tab: 'tests' },
  { icon: 'grade', label: 'Grades & Results', tab: 'results' },
  { icon: 'bar_chart', label: 'Performance Reports', tab: 'reports' },
  { icon: 'calendar_today', label: 'Lecture Calendar', tab: 'schedules' },
]

const SIDEBAR_ITEMS = {
  student: [
    { icon: 'home', label: 'Home', path: '/student/dashboard' },
    { icon: 'school', label: 'Academics', path: '/student/academics', children: ACADEMICS_SUBITEMS },
    { icon: 'assignment', label: 'Homework', path: '/student/homework' },
    { icon: 'chat', label: 'Chat', path: '/student/chat' },
    { icon: 'person', label: 'Account', path: '/student/settings' },
  ],
  teacher: [
    { icon: 'home', label: 'Home', path: '/teacher/dashboard' },
    { icon: 'calendar_today', label: 'Attendance', path: '/teacher/attendance' },
    { icon: 'assignment', label: 'Homework', path: '/teacher/homework' },
    { icon: 'school', label: 'Academics', path: '/teacher/academics', children: ACADEMICS_SUBITEMS },
    { icon: 'chat', label: 'Chat', path: '/teacher/chat' },
    { icon: 'person', label: 'Account', path: '/teacher/settings' },
  ],
  admin: [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: 'group', label: 'Users', path: '/admin/users' },
    { icon: 'school', label: 'Academics', path: '/admin/academics', children: ACADEMICS_SUBITEMS },
    { icon: 'campaign', label: 'Announce', path: '/admin/announcements' },
    { icon: 'chat', label: 'Chat', path: '/admin/chat' },
    { icon: 'person', label: 'Account', path: '/admin/settings' },
  ],
  superadmin: [
    { icon: 'dashboard', label: 'Dashboard', path: '/superadmin/dashboard' },
    { icon: 'shield', label: 'Admins', path: '/superadmin/admins' },
    { icon: 'payments', label: 'Payments', path: '/superadmin/payments' },
    { icon: 'person', label: 'Account', path: '/superadmin/settings' },
  ],
}

export default function DashboardLayout({ children, hideTopBar = false, fixedHeight = false, noPadding = false }) {
  const { user, logout } = useAuth()
  const role = user?.role || 'student'
  const navigate = useNavigate()
  const location = useLocation()

  const items = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.student

  // Which parent nav item (if any) has its submenu expanded
  const [expandedItem, setExpandedItem] = useState(null)
  const activeTabParam = new URLSearchParams(location.search).get('tab')

  const isParentActive = (item) =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')

  // Auto-expand the parent whose section is currently open
  useEffect(() => {
    const active = items.find((item) => item.children && isParentActive(item))
    setExpandedItem(active ? active.label : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-on-background antialiased flex flex-row">
      {/* Permanent Left Sidebar for Desktop/PC */}
      <aside className="w-64 border-r border-outline-variant/30 bg-surface-container-lowest h-screen sticky top-0 hidden md:flex flex-col justify-between p-6 select-none shrink-0">
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center gap-3 px-2 py-1 cursor-pointer" onClick={() => navigate(`/${role}/dashboard`)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6351E0] to-[#DD62F2] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[20px] font-black">school</span>
            </div>
            <div className="text-left">
              <h2 className="text-base font-black text-on-surface tracking-tight">Educore</h2>
              <span className="text-[9px] uppercase tracking-widest text-primary font-bold">{role} portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {items.map((item) => {
              const { icon, label, path, children: subItems } = item
              const isActive = isParentActive(item)

              if (!subItems) {
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-98 hover:-translate-x-0.5 duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm font-black'
                        : 'text-on-surface-variant hover:bg-surface-container-low font-semibold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    <span>{label}</span>
                  </NavLink>
                )
              }

              const isExpanded = expandedItem === label
              return (
                <div key={path}>
                  <button
                    type="button"
                    onClick={() => setExpandedItem(isExpanded ? null : label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-98 hover:-translate-x-0.5 duration-200 border-none cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm font-black'
                        : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low font-semibold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    <span className="flex-1 text-left">{label}</span>
                    <span
                      className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-1 ml-4 pl-3 border-l-2 border-outline-variant/30 space-y-0.5 animate-fadeIn">
                      {subItems.map((child) => {
                        const isChildActive = isActive && (activeTabParam || 'material') === child.tab
                        return (
                          <NavLink
                            key={child.tab}
                            to={`${path}?tab=${child.tab}`}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] transition-all duration-150 ${
                              isChildActive
                                ? 'bg-primary-fixed/40 text-primary font-bold'
                                : 'text-on-surface-variant hover:bg-surface-container-low font-semibold'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">{child.icon}</span>
                            <span>{child.label}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* User Card & Logout inside Sidebar */}
        <div className="border-t border-outline-variant/20 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.first_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-xs uppercase">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              )}
            </div>
            <div className="text-left overflow-hidden">
              <h4 className="text-xs font-bold text-on-surface truncate">
                {user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User'}
              </h4>
              <p className="text-[9px] text-outline font-semibold uppercase truncate">
                {role}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-error/10 hover:bg-error/15 text-error font-bold text-xs border-none cursor-pointer active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Layout Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* TopBar hidden on desktop since the sidebar handles profile and branding */}
        <div className="md:hidden">
          {!hideTopBar && <TopBar />}
        </div>
        
        <main className={
          noPadding
            ? 'w-full flex-1 flex flex-col min-h-0 overflow-hidden pb-20 md:pb-0'
            : `px-container-padding-mobile max-w-5xl md:max-w-7xl lg:max-w-[1440px] w-full mx-auto flex-1 flex flex-col min-h-0 ${
                fixedHeight ? 'pb-24 pt-2 overflow-hidden' : 'pb-28 pt-stack-md'
              } md:pt-8 md:pb-12`
        }>
          {children}
        </main>
        
        {/* Bottom Navigation hidden on desktop */}
        <div className="md:hidden">
          <BottomNav role={role} />
        </div>
      </div>
    </div>
  )
}
