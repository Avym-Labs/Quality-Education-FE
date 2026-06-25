import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { useAuth } from '../../context/AuthContext'

export default function DashboardLayout({ children, hideTopBar = false }) {
  const { user } = useAuth()
  const role = user?.role || 'student'

  return (
    <div className="min-h-screen bg-background text-on-background antialiased">
      {!hideTopBar && <TopBar />}
      <main className="px-container-padding-mobile pb-28 pt-stack-md max-w-5xl mx-auto">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
