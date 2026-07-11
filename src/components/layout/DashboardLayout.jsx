import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { useAuth } from '../../context/AuthContext'

export default function DashboardLayout({ children, hideTopBar = false, fixedHeight = false }) {
  const { user } = useAuth()
  const role = user?.role || 'student'

  return (
    <div className={`min-h-screen bg-background text-on-background antialiased flex flex-col ${fixedHeight ? 'h-screen overflow-hidden' : ''}`}>
      {!hideTopBar && <TopBar />}
      <main className={`px-container-padding-mobile max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-0 ${fixedHeight ? 'pb-24 pt-2 overflow-hidden' : 'pb-28 pt-stack-md'}`}>
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
