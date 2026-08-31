import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../common/Icon'

// Persistent desktop-only nav for the Account section. Shared between
// SettingsPage (in-page views) and other Account-linked pages that live on
// their own route (e.g. Manage Students) so the section nav never disappears
// when navigating between them.
const NAV_ITEMS = [
  { id: 'my-academic-profile', icon: 'account_box', label: 'My Profile', teacherOnly: true },
  { id: 'profile-details', icon: 'account_circle', label: 'Account Credentials' },
  { id: 'preferences', icon: 'notifications_active', label: 'Notification Preferences' },
  { id: 'language', icon: 'language', label: 'Language' },
  { id: 'switch-profile', icon: 'switch_account', label: 'Switch Account', teacherOnly: true },
  { id: 'manage-students', icon: 'group_add', label: 'Manage Students', teacherOnly: true, path: '/teacher/manage-students' },
  { id: 'support', icon: 'help_center', label: 'Help & Support' },
]

/**
 * `active` — id of the item to highlight.
 * `onSelect(id)` — called for in-page items (no `path`) when the page itself
 * hosts the view switcher (SettingsPage). Omit when embedding on a page that
 * only needs the "jump back into settings" links (e.g. Manage Students) —
 * those items then navigate to the role's settings route with the target
 * view passed via router state.
 */
export default function AccountSidebar({ active, onSelect }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const settingsPath = `/${user?.role || 'student'}/settings`

  const items = NAV_ITEMS.filter((item) => !item.teacherOnly || user?.role === 'teacher')

  const handleSelect = (item) => {
    if (item.path) {
      navigate(item.path)
    } else if (onSelect) {
      onSelect(item.id)
    } else {
      navigate(settingsPath, { state: { initialView: item.id } })
    }
  }

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to sign out?')) return
    const nextUser = logout()
    navigate(nextUser ? `/${nextUser.role}/dashboard` : '/login', { replace: true })
  }

  return (
    <nav className="hidden md:flex md:flex-col md:w-56 md:shrink-0 gap-1 sticky top-4 self-start">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleSelect(item)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer border-none ${
            active === item.id
              ? 'bg-primary-container/15 text-primary'
              : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <Icon name={item.icon} className="text-[18px]" />
          <span>{item.label}</span>
        </button>
      ))}

      <div className="my-2 border-t border-outline-variant/20" />

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left bg-transparent text-error hover:bg-error/10 transition-colors cursor-pointer border-none"
      >
        <Icon name="logout" className="text-[18px]" />
        <span>Logout Account</span>
      </button>
    </nav>
  )
}
