import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'
import { useNotifications } from '../../context/NotificationContext'

export default function NotificationCenter() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { refreshUnreadCount } = useNotifications()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [latestAnnouncement, setLatestAnnouncement] = useState(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications')
      setNotifications(res.data || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError(t('notificationCenter.failedToFetch'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    async function fetchLatestAnnouncement() {
      try {
        const res = await api.get('/announcements')
        const list = res.data || []
        if (list.length > 0) setLatestAnnouncement(list[0])
      } catch (err) {
        console.error('Failed to load latest announcement:', err)
      }
    }
    fetchLatestAnnouncement()
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      fetchNotifications()
      refreshUnreadCount()
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      await api.delete('/notifications')
      setNotifications([])
    } catch (err) {
      console.error('Failed to delete all notifications:', err)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      // Mark mock ones read locally
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      // Mark database ones read
      await api.post('/notifications/read-all')
      fetchNotifications()
      refreshUnreadCount()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const allNotifs = notifications

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

  // Always shows the exact date + time together, regardless of which
  // Today/Yesterday/Earlier bucket the notification falls into.
  const formatDateTime = (isoString) => {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${datePart}, ${timePart}`
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
              <Icon name="arrow_back" />
            </button>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">{t('notificationCenter.title')}</h2>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={allNotifs.length === 0}
            title={t('notificationCenter.deleteAllTitle')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-error hover:bg-error-container/20 transition-colors active:scale-95 duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Icon name="delete" className="text-xl" />
          </button>
        </section>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn duration-200 p-4">
            <div className="bg-surface w-full max-w-sm rounded-3xl shadow-xl p-6 space-y-4">
              <h3 className="text-base font-black text-on-surface">{t('notificationCenter.deleteAllConfirmTitle')}</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                {t('notificationCenter.deleteAllConfirmBody')}
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-full border border-outline text-on-surface-variant font-bold text-xs hover:bg-surface-container transition-colors disabled:opacity-60"
                >
                  {t('notificationCenter.cancel')}
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-full bg-error text-on-error font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {deleting ? t('notificationCenter.deleting') : t('notificationCenter.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Quick Action Header */}
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="font-label-md text-xs text-on-surface-variant">
            {newUpdatesCount > 0 ? t('notificationCenter.newUpdatesSinceMorning', { count: newUpdatesCount }) : t('notificationCenter.noUnreadUpdates')}
          </p>
          {newUpdatesCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-primary font-bold text-xs hover:underline transition-all"
            >
              {t('notificationCenter.markAllAsRead')}
            </button>
          )}
        </div>

        {!loading && allNotifs.length === 0 && (
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-10 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
            <Icon name="notifications_off" className="text-4xl text-outline" />
            <p className="font-semibold">{t('notificationCenter.noNotificationsYet')}</p>
          </div>
        )}

        {/* Today Notifications */}
        {today.length > 0 && (
          <section className="space-y-stack-md">
            <h3 className="font-title-lg text-sm text-on-surface border-b border-outline-variant/15 pb-2 font-bold uppercase tracking-wider">{t('notificationCenter.today')}</h3>
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
                      <Icon name={meta.icon} className="text-lg" />
                    </div>
                    <div className="flex-grow min-w-0 pr-4">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-sm text-on-surface truncate">{n.title}</h4>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium ml-2">{formatDateTime(n.created_at)}</span>
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
            <h3 className="font-title-lg text-sm text-on-surface border-b border-outline-variant/15 pb-2 font-bold uppercase tracking-wider">{t('notificationCenter.yesterday')}</h3>
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
                      <Icon name={meta.icon} className="text-lg" />
                    </div>
                    <div className="flex-grow min-w-0 pr-2">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-sm text-on-surface truncate">{n.title}</h4>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium ml-2">{formatDateTime(n.created_at)}</span>
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
            <h3 className="font-title-lg text-sm text-on-surface border-b border-outline-variant/15 pb-2 font-bold uppercase tracking-wider">{t('notificationCenter.earlier')}</h3>
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
                      <Icon name={meta.icon} className="text-lg" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-sm text-on-surface truncate">{n.title}</h4>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium ml-2">{formatDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed font-normal">{n.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Latest Announcement Card — real, from the most recent school announcement */}
        {latestAnnouncement && (
          <section className="mt-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary-container p-6 text-on-primary-container shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-15">
                <Icon name="campaign" className="text-[80px]" />
              </div>
              <div className="relative z-10 space-y-2">
                <div className="bg-on-primary-container/20 w-fit px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  {t('notificationCenter.latestAnnouncement')}
                </div>
                <h3 className="font-headline-lg-mobile text-lg leading-tight font-bold">
                  {latestAnnouncement.title}
                </h3>
                <p className="text-xs max-w-[85%] opacity-90 leading-relaxed line-clamp-3">
                  {latestAnnouncement.content}
                </p>
              </div>
            </div>
          </section>
        )}

      </div>
    </DashboardLayout>
  )
}
