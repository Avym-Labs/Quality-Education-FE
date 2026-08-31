import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { useAuth } from '../../context/AuthContext'
import Icon from '../common/Icon'
import logo from '../../assets/logo.png'

// Shared submenu shown under "Academics" for every role, mirrors the tabs inside AcademicsHub
const ACADEMICS_SUBITEMS = [
  { icon: 'library_books', labelKey: 'nav.studyMaterial', tab: 'material' },
  { icon: 'quiz', labelKey: 'nav.testsAnswerKeys', tab: 'tests' },
  { icon: 'grade', labelKey: 'nav.gradesResults', tab: 'results' },
  { icon: 'bar_chart', labelKey: 'nav.performanceReports', tab: 'reports' },
  { icon: 'calendar_today', labelKey: 'nav.lectureCalendar', tab: 'schedules' },
]

// Student/teacher also get Homework as an Academics tab; admin never had a
// standalone Homework nav item so keeps the plain submenu above.
const ACADEMICS_SUBITEMS_WITH_HOMEWORK = [
  ...ACADEMICS_SUBITEMS,
  { icon: 'assignment', labelKey: 'nav.homework', tab: 'homework' },
]

const SIDEBAR_ITEMS = {
  student: [
    { icon: 'home', labelKey: 'nav.home', path: '/student/dashboard' },
    { icon: 'school', labelKey: 'nav.academics', path: '/student/academics', children: ACADEMICS_SUBITEMS_WITH_HOMEWORK },
    { icon: 'event_busy', labelKey: 'nav.leave', path: '/student/leave' },
    { icon: 'chat', labelKey: 'nav.chat', path: '/student/chat' },
    { icon: 'person', labelKey: 'nav.account', path: '/student/settings' },
  ],
  teacher: [
    { icon: 'home', labelKey: 'nav.home', path: '/teacher/dashboard' },
    { icon: 'calendar_today', labelKey: 'nav.attendance', path: '/teacher/attendance' },
    { icon: 'school', labelKey: 'nav.academics', path: '/teacher/academics', children: ACADEMICS_SUBITEMS_WITH_HOMEWORK },
    { icon: 'group_add', labelKey: 'nav.manageStudents', path: '/teacher/manage-students' },
    { icon: 'chat', labelKey: 'nav.chat', path: '/teacher/chat' },
    { icon: 'person', labelKey: 'nav.account', path: '/teacher/settings' },
  ],
  admin: [
    { icon: 'dashboard', labelKey: 'nav.dashboard', path: '/admin/dashboard' },
    { icon: 'group', labelKey: 'nav.users', path: '/admin/users' },
    { icon: 'school', labelKey: 'nav.academics', path: '/admin/academics', children: ACADEMICS_SUBITEMS },
    { icon: 'campaign', labelKey: 'nav.announce', path: '/admin/announcements' },
    { icon: 'chat', labelKey: 'nav.chat', path: '/admin/chat' },
    { icon: 'person', labelKey: 'nav.account', path: '/admin/settings' },
  ],
  superadmin: [
    { icon: 'dashboard', labelKey: 'nav.dashboard', path: '/superadmin/dashboard' },
    { icon: 'shield', labelKey: 'nav.admins', path: '/superadmin/admins' },
    { icon: 'payments', labelKey: 'nav.payments', path: '/superadmin/payments' },
    { icon: 'person', labelKey: 'nav.account', path: '/superadmin/settings' },
  ],
}

export default function DashboardLayout({ children, hideTopBar = false, fixedHeight = false, noPadding = false }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const role = user?.role || 'student'
  const navigate = useNavigate()
  const location = useLocation()

  const items = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.student

  // Which parent nav item (if any) has its submenu expanded — tracked by
  // path rather than label so it doesn't break when the label is translated.
  const [expandedPath, setExpandedPath] = useState(null)
  const activeTabParam = new URLSearchParams(location.search).get('tab')

  const isParentActive = (item) =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')

  // Auto-expand the parent whose section is currently open
  useEffect(() => {
    const active = items.find((item) => item.children && isParentActive(item))
    setExpandedPath(active ? active.path : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-on-background antialiased flex flex-row">
      {/* Permanent Left Sidebar for Desktop/PC */}
      <aside className="w-64 border-r border-outline-variant/30 bg-surface-container-lowest h-screen sticky top-0 hidden md:flex flex-col justify-between p-6 select-none shrink-0">
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center gap-3 px-2 py-1 cursor-pointer" onClick={() => navigate(`/${role}/dashboard`)}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <img src={logo} alt="Educore" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-black text-on-surface tracking-tight">Educore</h2>
              <span className="text-[9px] uppercase tracking-widest text-primary font-bold">{t(`nav.${role}Portal`)}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {items.map((item) => {
              const { icon, labelKey, path, children: subItems } = item
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
                    <Icon name={icon} className="text-[18px]" />
                    <span>{t(labelKey)}</span>
                  </NavLink>
                )
              }

              const isExpanded = expandedPath === path
              return (
                <div key={path}>
                  <button
                    type="button"
                    onClick={() => setExpandedPath(isExpanded ? null : path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-98 hover:-translate-x-0.5 duration-200 border-none cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm font-black'
                        : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low font-semibold'
                    }`}
                  >
                    <Icon name={icon} className="text-[18px]" />
                    <span className="flex-1 text-left">{t(labelKey)}</span>
                    <Icon
                      name="expand_more"
                      className={`text-[16px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
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
                            <Icon name={child.icon} className="text-[15px]" />
                            <span>{t(child.labelKey)}</span>
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
            <Icon name="logout" className="text-[16px]" />
            <span>{t('common.signOut')}</span>
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
            : `px-container-padding-mobile md:px-6 w-full flex-1 flex flex-col min-h-0 ${
                fixedHeight ? 'pb-24 pt-2 overflow-hidden' : 'pb-28 pt-stack-md'
              } md:pt-4 md:pb-4`
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
