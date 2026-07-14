import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [homeworkCount, setHomeworkCount] = useState(5)
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0)
  const [presentCount, setPresentCount] = useState(38)
  const [absentCount, setAbsentCount] = useState(4)
  const [activeChart, setActiveChart] = useState('performance')

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveChart(prev => prev === 'performance' ? 'attendance' : 'performance')
    }, 10000)
    return () => clearTimeout(timer)
  }, [activeChart])

  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [switchingTo, setSwitchingTo] = useState(null)
  const [switchError, setSwitchError] = useState('')
  const { user: currentUser, switchAccount, addAccount } = useAuth()
  const [savedAccounts, setSavedAccounts] = useState([])

  useEffect(() => {
    if (showSwitchModal) {
      const savedRaw = localStorage.getItem('educore_saved_accounts')
      let savedList = savedRaw ? JSON.parse(savedRaw) : []
      const exists = savedList.some(acc => acc.user_id === currentUser.id)
      
      if (!exists && currentUser) {
        savedList.push({
          user_id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          role: currentUser.role,
          avatar: currentUser.avatar,
          access_token: localStorage.getItem('access_token'),
          refresh_token: localStorage.getItem('refresh_token'),
          user_data: currentUser
        })
        localStorage.setItem('educore_saved_accounts', JSON.stringify(savedList))
      }
      
      setSavedAccounts(savedList.filter(acc => acc.user_id !== currentUser.id))
    }
  }, [showSwitchModal, currentUser])

  const handleSwitchProfile = (targetUserId) => {
    setSwitchError('')
    setSwitchingTo(targetUserId)
    try {
      const switched = switchAccount(targetUserId)
      if (switched) {
        setShowSwitchModal(false)
        navigate(`/${switched.role}/dashboard`, { replace: true })
      } else {
        setSwitchError('Failed to switch account profile.')
      }
    } catch (err) {
      console.error(err)
      setSwitchError('An error occurred during account switch.')
    } finally {
      setSwitchingTo(null)
    }
  }

  const handleAddNewAccount = () => {
    addAccount()
    navigate('/login')
  }

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        // Fetch homework count
        const hwRes = await api.get('/homework')
        if (hwRes.data) {
          setHomeworkCount(hwRes.data.length)
        }

        // Fetch leave count
        if (user?.id) {
          const leaveRes = await api.get('/leave', { params: { user_id: user.id, status: 'pending' } })
          if (leaveRes.data) {
            setPendingLeaveCount(leaveRes.data.length)
          }
        }

        // Fetch today's attendance summary
        const summaryRes = await api.get('/attendance/today-summary')
        if (summaryRes.data) {
          setPresentCount(summaryRes.data.present)
          setAbsentCount(summaryRes.data.absent)
        }
      } catch (err) {
        console.error('Failed to load teacher stats:', err)
      }
    }
    fetchDashboardStats()
  }, [user])

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Mock schedule
  const todayClasses = [
    { time: '09:00 AM', grade: '10-A', subject: 'Mathematics', room: 'Room 302' },
    { time: '11:30 AM', grade: '11-B', subject: 'Mathematics', room: 'Room 104' },
    { time: '02:00 PM', grade: '12-A', subject: 'Advanced Calculus', room: 'Lab 2' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        



        {/* Stats Bento Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {/* Total Students handled */}
          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-default hover:bg-surface-container-low transition-colors duration-200">
            <span className="material-symbols-outlined text-primary text-3xl">groups</span>
            <div>
              <div className="font-numeric-bold text-headline-lg text-on-surface font-bold leading-none">42</div>
              <div className="font-label-md text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1.5 min-h-[32px] flex items-start">Total Students</div>
            </div>
          </div>

          {/* Present Students */}
          <div 
            onClick={() => navigate('/teacher/attendance')}
            className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
            <div>
              <div className="font-numeric-bold text-headline-lg text-on-surface font-bold leading-none">{presentCount}</div>
              <div className="font-label-md text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1.5 min-h-[32px] flex items-start">Present Students</div>
            </div>
          </div>

          {/* Absent Students */}
          <div 
            onClick={() => navigate('/teacher/attendance')}
            className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-error text-3xl">cancel</span>
            <div>
              <div className="font-numeric-bold text-headline-lg text-on-surface font-bold leading-none">{absentCount}</div>
              <div className="font-label-md text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1.5 min-h-[32px] flex items-start">Absent Students</div>
            </div>
          </div>

          {/* Homeworks */}
          <div 
            onClick={() => navigate('/teacher/homework')}
            className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-secondary text-3xl">assignment</span>
            <div>
              <div className="font-numeric-bold text-headline-lg text-on-surface font-bold leading-none">{homeworkCount}</div>
              <div className="font-label-md text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1.5 min-h-[32px] flex items-start">Homework Assigned</div>
            </div>
          </div>
        </section>


        {/* Main Content Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
          
          {/* Consolidated Graphs Carousel */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-stack-lg rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col justify-between h-[360px]">
            <div className="flex justify-between items-center gap-2 mb-4 w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-title-lg text-base text-on-surface font-bold truncate">
                  {activeChart === 'performance' ? 'Class Performance Overview' : 'Weekly Class Attendance'}
                </h3>
                <span className="px-2 py-0.5 bg-primary-container text-on-primary-container rounded-full text-[9px] font-bold shrink-0">Grade 10-A</span>
              </div>
              <select
                value={activeChart}
                onChange={(e) => setActiveChart(e.target.value)}
                className="w-fit px-2 py-0.5 rounded-lg border border-outline bg-surface-container-low text-[10px] font-bold outline-none focus:border-primary cursor-pointer text-on-surface shrink-0"
              >
                <option value="performance">Academics Performance</option>
                <option value="attendance">Weekly Attendance</option>
              </select>
            </div>

            <div className="flex-1 transition-all duration-300">
              {activeChart === 'performance' ? (
                <div className="animate-fadeIn h-full flex flex-col justify-between">
                  {/* Custom Bar Graph */}
                  <div className="flex-1 flex items-end gap-4 pb-2 px-2 pt-6 h-[180px]">
                    {[60, 75, 94, 70, 50].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group" name={`bar-group-${idx}`}>
                        <div className="relative w-full h-full flex items-end justify-center">
                          <div 
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-90 ${
                              idx === 2 ? 'bg-primary' : 'bg-primary-fixed-dim'
                            }`}
                            style={{ height: `${val}%` }}
                          ></div>
                          <span className="absolute -top-7 bg-on-surface text-surface text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10">
                            {val}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider pt-2 border-t border-outline-variant/20">
                    {['Algebra', 'Geometry', 'Trig', 'Calculus', 'Stats'].map((subj, idx) => (
                      <span key={idx} className="flex-1 text-center truncate">{subj}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="animate-fadeIn h-full flex flex-col justify-between">
                  {/* Weekly Attendance Bars */}
                  <div className="flex-1 flex items-end gap-4 pb-2 px-2 pt-6 h-[180px]">
                    {[92, 95, 88, 96, 91].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="relative w-full h-full flex items-end justify-center">
                          <div 
                            className="w-full max-w-[40px] rounded-t-lg bg-emerald-500 transition-all duration-500 hover:opacity-90"
                            style={{ height: `${val}%` }}
                          ></div>
                          <span className="absolute -top-7 bg-on-surface text-surface text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10">
                            {val}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider pt-2 border-t border-outline-variant/20">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                      <span key={idx} className="flex-1 text-center truncate">{day}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-stack-lg rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col justify-between">
            <div>
              <h3 className="font-title-lg text-base text-on-surface font-bold mb-4">Today's Class Schedule</h3>
              <div className="space-y-3">
                {todayClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex flex-col items-center justify-center font-bold text-primary text-[10px] uppercase shrink-0">
                      <span>{cls.grade}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-on-surface truncate">{cls.subject}</p>
                      <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">{cls.time} • {cls.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Attendance Alerts */}
        <div className="bg-surface-container-lowest p-stack-lg rounded-[28px] shadow-sm border border-outline-variant/35">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-title-lg text-base text-on-surface font-bold">Low Attendance</h3>
            <span 
              onClick={() => navigate('/teacher/attendance')}
              className="text-primary font-bold text-xs cursor-pointer hover:underline"
            >
              View History
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-error-container/10 border border-error/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center text-xs font-bold shrink-0">
                  LH
                </div>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Leo Harrison</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium">68% Overall Attendance</p>
                </div>
              </div>
              <div className="text-error font-bold text-xs uppercase tracking-wider">Critical</div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-orange-50 border border-orange-100 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-xs font-bold shrink-0">
                  MT
                </div>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Mia Thompson</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium">74% Overall Attendance</p>
                </div>
              </div>
              <div className="text-orange-500 font-bold text-xs uppercase tracking-wider">Warning</div>
            </div>
          </div>
        </div>

      </div>
      {/* Switch Account Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md p-6 shadow-2xl border border-outline-variant/40 animate-scaleIn">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15 mb-4">
              <h3 className="font-title-lg text-base text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">swap_horiz</span>
                <span>Switch Profile</span>
              </h3>
              <button 
                onClick={() => setShowSwitchModal(false)}
                className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container"
              >
                close
              </button>
            </div>

            {switchError && (
              <div className="p-3 bg-error-container rounded-xl text-error text-xs font-semibold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">error</span>
                <span>{switchError}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {savedAccounts.length === 0 ? (
                <div className="text-center py-4 bg-surface-container-low/40 rounded-2xl border border-outline-variant/15 text-xs text-on-surface-variant font-semibold">
                  No other profiles found. You can add an existing account to switch between profiles.
                </div>
              ) : (
                savedAccounts.map(acc => (
                  <div 
                    key={acc.user_id}
                    onClick={() => handleSwitchProfile(acc.user_id)}
                    className="flex items-center gap-4 p-3 rounded-2xl border border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer group"
                  >
                    {acc.avatar ? (
                      <img src={acc.avatar} alt={acc.full_name} className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-extrabold uppercase">
                        {acc.full_name?.[0] || 'U'}
                      </div>
                    )}
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{acc.full_name}</h4>
                      <span className="text-[9px] uppercase font-bold text-primary-fixed-dim bg-primary-fixed px-1.5 py-0.5 rounded inline-block mt-0.5">{acc.role}</span>
                      <p className="text-[10px] text-outline font-semibold mt-1">{acc.email}</p>
                    </div>
                    {switchingTo === acc.user_id ? (
                      <span className="material-symbols-outlined animate-spin text-primary ml-auto text-base">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-outline ml-auto text-base group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                    )}
                  </div>
                ))
              )}

              {/* Add Account Button */}
              <button 
                onClick={handleAddNewAccount}
                className="w-full flex items-center justify-center gap-2 mt-4 py-3 border-2 border-dashed border-outline-variant hover:bg-surface-container-low rounded-2xl transition-colors text-xs font-bold text-primary"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Add Existing Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
