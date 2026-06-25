import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function NotificationCenter() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications')
      setNotifications(res.data || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Could not fetch notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkRead = async (id) => {
    // If it's a mock notification, just update state locally
    if (id.startsWith('mock')) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      return
    }

    try {
      await api.patch(`/notifications/${id}/read`)
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      // Mark mock ones read locally
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      // Mark database ones read
      await api.post('/notifications/read-all')
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  // Fallback mock notifications matching the design mockup
  const fallbackNotifications = [
    {
      id: 'mock1',
      type: 'assessment',
      title: 'Mathematics Marks Published',
      message: 'Mid-term results for Chapter 4: Linear Equations are now available. Check your grade in the academic portal.',
      is_read: false,
      created_at: new Date().toISOString(), // Today
      icon: 'assessment',
      color: 'text-primary bg-primary-container/10'
    },
    {
      id: 'mock2',
      type: 'assignment',
      title: 'New Physics Assignment',
      message: 'Thermodynamics Lab Report is due on Oct 20. Please refer to the rubric provided in class.',
      is_read: false,
      created_at: new Date().toISOString(), // Today
      icon: 'assignment',
      color: 'text-primary bg-primary-container/10'
    },
    {
      id: 'mock3',
      type: 'study_material',
      title: 'Advanced Calculus Notes',
      message: 'Dr. Mitchell has uploaded the comprehensive review notes for the upcoming final examinations.',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      icon: 'auto_stories',
      color: 'text-on-surface-variant bg-surface-container-highest'
    },
    {
      id: 'mock4',
      type: 'announcement',
      title: 'School Assembly',
      message: 'Reminder: Mandatory morning assembly tomorrow at 8:00 AM in the Main Hall for all senior students.',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      icon: 'campaign',
      color: 'text-on-surface-variant bg-surface-container-highest'
    },
    {
      id: 'mock5',
      type: 'leave',
      title: 'Leave Request Approved',
      message: 'Your leave request for Oct 12-14 has been Approved by the Principal\'s office.',
      is_read: true,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Earlier
      icon: 'event_available',
      color: 'text-tertiary bg-tertiary-fixed'
    }
  ]

  // Combine database notifications with fallback mocks
  const allNotifs = [...notifications, ...fallbackNotifications.filter(f => !notifications.some(n => n.title === f.title))]

  // Categorize notifications
  const categorizeNotifs = () => {
    const today = []
    const yesterday = []
    const earlier = []

    const todayDate = new Date().toDateString()
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

    allNotifs.forEach(n => {
      const d = new Date(n.created_at).toDateString()
      if (d === todayDate) {
        today.push(n)
      } else if (d === yesterdayDate) {
        yesterday.push(n)
      } else {
        earlier.push(n)
      }
    })

    return { today, yesterday, earlier }
  }

  const { today, yesterday, earlier } = categorizeNotifs()
  const newUpdatesCount = allNotifs.filter(n => !n.is_read).length

  // Helper to format date display
  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '10:00 AM'
    }
  }

  const formatDateLabel = (isoString) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return 'Oct 14'
    }
  }

  // Get icon and color dynamically for db notification
  const getNotifMeta = (type) => {
    switch (type) {
      case 'result':
      case 'assessment':
        return { icon: 'assessment', color: 'text-primary bg-primary-container/10' }
      case 'homework':
      case 'assignment':
        return { icon: 'assignment', color: 'text-primary bg-primary-container/10' }
      case 'study_material':
        return { icon: 'auto_stories', color: 'text-on-surface-variant bg-surface-container-highest' }
      case 'announcement':
        return { icon: 'campaign', color: 'text-on-surface-variant bg-surface-container-highest' }
      case 'leave':
        return { icon: 'event_available', color: 'text-tertiary bg-tertiary-fixed' }
      default:
        return { icon: 'notifications', color: 'text-primary bg-primary-container/10' }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 max-w-3xl mx-auto">
        
        {/* Header Navigation controls */}
        <section className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-stack-sm">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Notifications</h2>
          </div>
          <span className="material-symbols-outlined text-primary text-2xl">notifications</span>
        </section>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Quick Action Header */}
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="font-label-md text-xs text-on-surface-variant">
            {newUpdatesCount > 0 ? `${newUpdatesCount} new updates since morning` : 'No unread updates'}
          </p>
          {newUpdatesCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-primary font-bold text-xs hover:underline transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Today Notifications */}
        {today.length > 0 && (
          <section className="space-y-stack-md">
            <h3 className="font-title-lg text-sm text-on-surface border-b border-outline-variant/15 pb-2 font-bold uppercase tracking-wider">Today</h3>
            <div className="grid gap-stack-sm">
              {today.map((n) => {
                const meta = n.icon ? n : { ...n, ...getNotifMeta(n.type) }
                return (
                  <div 
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`group relative border border-outline-variant p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-start gap-4 cursor-pointer ${
                      n.is_read ? 'bg-surface-container-lowest opacity-85' : 'bg-surface-container-lowest font-semibold border-primary/20'
                    }`}
                  >
                    {!n.is_read && (
                      <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary-container/20"></div>
                    )}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${meta.color}`}>
                      <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                    </div>
                    <div className="flex-grow min-w-0 pr-4">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-sm text-on-surface truncate">{n.title}</h4>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium ml-2">{formatTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed font-normal">{n.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Yesterday Notifications */}
        {yesterday.length > 0 && (
          <section className="space-y-stack-md mt-6">
            <h3 className="font-title-lg text-sm text-on-surface border-b border-outline-variant/15 pb-2 font-bold uppercase tracking-wider">Yesterday</h3>
            <div className="grid gap-stack-sm">
              {yesterday.map((n) => {
                const meta = n.icon ? n : { ...n, ...getNotifMeta(n.type) }
                return (
                  <div 
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`border border-outline-variant/35 p-4 rounded-2xl transition-all flex items-start gap-4 cursor-pointer hover:shadow-sm ${
                      n.is_read ? 'bg-surface-container opacity-85' : 'bg-surface-container-lowest font-semibold border-primary/25'
                    }`}
                  >
                    {!n.is_read && (
                      <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary-container/20"></div>
                    )}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${meta.color}`}>
                      <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                    </div>
                    <div className="flex-grow min-w-0 pr-2">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-sm text-on-surface truncate">{n.title}</h4>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium ml-2">Yesterday</span>
                      </div>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed font-normal">{n.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Earlier Notifications */}
        {earlier.length > 0 && (
          <section className="space-y-stack-md mt-6">
            <h3 className="font-title-lg text-sm text-on-surface border-b border-outline-variant/15 pb-2 font-bold uppercase tracking-wider">Earlier</h3>
            <div className="grid gap-stack-sm">
              {earlier.map((n) => {
                const meta = n.icon ? n : { ...n, ...getNotifMeta(n.type) }
                return (
                  <div 
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className="bg-surface-container border border-outline-variant/30 p-4 rounded-2xl transition-all flex items-start gap-4 opacity-75 cursor-pointer hover:opacity-90"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${meta.color}`}>
                      <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-sm text-on-surface truncate">{n.title}</h4>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium ml-2">{formatDateLabel(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed font-normal">{n.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Bento Promotion Card */}
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary-container p-6 text-on-primary-container shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-15">
              <span className="material-symbols-outlined text-[80px]">school</span>
            </div>
            <div className="relative z-10 space-y-2">
              <div className="bg-on-primary-container/20 w-fit px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                Robotics Fest
              </div>
              <h3 className="font-headline-lg-mobile text-lg leading-tight font-bold">
                Inter-School Robotics Competition Registration is Open!
              </h3>
              <p className="text-xs max-w-[85%] opacity-90 leading-relaxed">
                Showcase your innovation, team up with your peers, and win exciting state championships. Apply before next Friday.
              </p>
              <button 
                onClick={() => navigate('/admin/announcements')}
                className="mt-4 px-5 py-2 bg-surface text-primary font-bold text-xs rounded-full shadow-md active:scale-95 transition-transform"
              >
                Create Broadcast
              </button>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
