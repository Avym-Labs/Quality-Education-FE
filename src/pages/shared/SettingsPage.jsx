import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // activeView: 'menu' | 'my-academic-profile' | 'profile-details' | 'preferences' | 'support' | 'switch-profile'
  const [activeView, setActiveView] = useState('menu')

  // Toggle States
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)

  // Edit Profile form state
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [submitting, setSubmitting] = useState(false)

  // Switch Account States
  const [savedAccounts, setSavedAccounts] = useState([])

  // Academic Profile details (For teachers)
  const qualifications = user?.qualifications || [
    'PhD in Theoretical Mathematics (Stanford University, 2015)',
    'M.Sc. in Mathematics & Computing (IIT Bombay, 2011)'
  ]
  const department = user?.department || 'Mathematics Department'
  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']
  const subjects = user?.subjects || ['Mathematics', 'Science']

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setPhone(user.phone || '')
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    try {
      const roster = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      const others = roster.filter(r => r.user_id !== user.id)
      setSavedAccounts(others)
    } catch (err) {
      console.error('Failed to load accounts in Settings:', err)
    }
  }, [user])

  const handleSwitchProfile = async (targetUserId) => {
    try {
      const roster = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      const match = roster.find(r => r.user_id === targetUserId)
      if (!match) return

      // Save current profile to roster before swapping
      const currentRoster = roster.filter(r => r.user_id !== user.id)
      const currentSavedUser = {
        user_id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        avatar: user.avatar,
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        department: user.department,
        teacher_id: user.teacher_id,
        student_id: user.student_id,
        grade: user.grade,
        section: user.section
      }
      currentRoster.push(currentSavedUser)
      localStorage.setItem('educore_saved_accounts', JSON.stringify(currentRoster))

      // Swap active session details
      localStorage.setItem('access_token', match.access_token)
      localStorage.setItem('refresh_token', match.refresh_token)
      localStorage.setItem('user', JSON.stringify({
        id: match.user_id,
        email: match.email,
        phone: match.phone,
        role: match.role,
        first_name: match.first_name,
        last_name: match.last_name,
        full_name: match.full_name,
        avatar: match.avatar,
        department: match.department,
        teacher_id: match.teacher_id,
        student_id: match.student_id,
        grade: match.grade,
        section: match.section
      }))

      navigate(`/${match.role}/dashboard`, { replace: true })
      window.location.reload()
    } catch (err) {
      console.error('Failed to switch profile:', err)
    }
  }

  const handleAddNewAccount = () => {
    try {
      const roster = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      const currentRoster = roster.filter(r => r.user_id !== user.id)
      currentRoster.push({
        user_id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        avatar: user.avatar,
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        department: user.department,
        teacher_id: user.teacher_id,
        student_id: user.student_id,
        grade: user.grade,
        section: user.section
      })
      localStorage.setItem('educore_saved_accounts', JSON.stringify(currentRoster))

      // Wipe active session
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')

      navigate('/login')
      window.location.reload()
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      const nextUser = logout()
      if (nextUser) {
        navigate(`/${nextUser.role}/dashboard`, { replace: true })
      } else {
        navigate('/login')
      }
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const updatedUser = {
        ...user,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setIsEditing(false)
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 max-w-2xl mx-auto">
        
        {/* Top Header */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20 mb-4">
          <button 
            onClick={() => {
              if (activeView !== 'menu') {
                setActiveView('menu')
              } else {
                navigate(-1)
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
              {activeView === 'menu' && 'Account'}
              {activeView === 'my-academic-profile' && 'Academic Profile'}
              {activeView === 'profile-details' && 'Account Credentials'}
              {activeView === 'preferences' && 'User Preferences'}
              {activeView === 'support' && 'Help & FAQ'}
              {activeView === 'switch-profile' && 'Switch Account'}
            </h2>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold mt-0.5 tracking-wider">
              {activeView === 'menu' && (user?.role === 'teacher' ? 'Department Faculty Portal' : 'Student Hub')}
              {activeView === 'my-academic-profile' && 'Faculty credentials & achievements'}
              {activeView === 'profile-details' && 'Modify your metadata & credentials'}
              {activeView === 'preferences' && 'Alert notifications & toggles'}
              {activeView === 'support' && 'FAQ center & support assistance'}
              {activeView === 'switch-profile' && 'Manage multi-account profile logins'}
            </p>
          </div>
        </section>

        {/* View 1: Root Menu */}
        {activeView === 'menu' && (
          <div className="space-y-3.5 animate-fadeIn">
            
            {/* My Academic Profile (Exclusively visible for Teachers) */}
            {user?.role === 'teacher' && (
              <div 
                onClick={() => setActiveView('my-academic-profile')}
                className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">account_box</span>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-on-surface">My Profile</h4>
                    <p className="text-[10px] text-outline font-semibold">View qualifications, experience summary, and student stats</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
              </div>
            )}

            {/* Account Settings */}
            <div 
              onClick={() => setActiveView('profile-details')}
              className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-on-surface">Account Credentials</h4>
                  <p className="text-[10px] text-outline font-semibold">Edit name, phone number, and account access</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>

            {/* Preferences */}
            <div 
              onClick={() => setActiveView('preferences')}
              className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">notifications_active</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-on-surface">Notification Preferences</h4>
                  <p className="text-[10px] text-outline font-semibold">Toggle push notifications and email summaries</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>

            {/* Switch Account Option (Exclusively visible for Teachers) */}
            {user?.role === 'teacher' && (
              <div 
                onClick={() => setActiveView('switch-profile')}
                className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-xl">switch_account</span>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-on-surface">Switch Account</h4>
                    <p className="text-[10px] text-outline font-semibold">Swap active session contexts instantly</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
              </div>
            )}

            {/* Help & FAQ Support */}
            <div 
              onClick={() => setActiveView('support')}
              className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">help_center</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-on-surface">Help & Support</h4>
                  <p className="text-[10px] text-outline font-semibold">View support documents and contact administrator</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>

            {/* Logout Trigger */}
            <div 
              onClick={handleLogout}
              className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl hover:bg-red-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-xl">logout</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-error">Logout Account</h4>
                  <p className="text-[10px] text-red-400 font-semibold mt-0.5">Terminate current active session</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-red-300 group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>
          </div>
        )}

        {/* View 2: Academic Profile (Embed Layout) */}
        {activeView === 'my-academic-profile' && user?.role === 'teacher' && (
          <div className="space-y-stack-lg animate-scaleIn text-xs">
            
            {/* Back Header */}
            <button 
              onClick={() => setActiveView('menu')}
              className="flex items-center gap-1.5 text-primary font-bold hover:underline mb-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Account</span>
            </button>

            {/* Profile Card Section */}
            <section className="bg-surface-container-lowest rounded-[28px] p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center md:flex-row md:gap-8 text-center md:text-left">
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-fixed ring-4 ring-primary-container/10 bg-surface-container-low flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.full_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-primary/40">face</span>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex-1">
                <h3 className="font-headline-lg-mobile text-base text-on-surface font-bold">
                  {user?.full_name || 'Prof. Sarah Mitchell'}
                </h3>
                <p className="text-on-surface-variant text-xs font-semibold flex items-center justify-center md:justify-start gap-1 mt-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">functions</span>
                  <span>{department}</span>
                </p>
                <div className="mt-3.5 flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-3 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Senior Faculty
                  </span>
                  <span className="px-3 py-0.5 bg-secondary-container text-on-secondary-container font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Curriculum Lead
                  </span>
                </div>
              </div>
            </section>

            {/* Assigned Classes */}
            <section className="space-y-3">
              <h4 className="font-title-lg text-xs text-on-surface font-bold">Assigned Classes</h4>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {assignedClasses.map((cls, idx) => (
                  <div 
                    key={cls}
                    onClick={() => navigate('/teacher/attendance/mark')}
                    className="flex-shrink-0 bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl shadow-sm hover:border-primary transition-all cursor-pointer group min-w-[140px]"
                  >
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Class {cls}</p>
                    <h5 className="font-numeric-bold text-xs font-bold text-on-surface mt-1">
                      {subjects[idx] || subjects[0] || 'Mathematics'}
                    </h5>
                    <div className="mt-2.5 flex items-center gap-1 text-primary group-hover:gap-1.5 transition-all text-[11px] font-bold">
                      <span>Mark Attendance</span>
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Stats Row */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between h-28">
                <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">groups</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[8px] uppercase tracking-wider font-bold">Students Handled</p>
                  <p className="font-numeric-bold text-base font-bold text-on-surface mt-0.5">42</p>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between h-28">
                <div className="w-8 h-8 rounded-full bg-secondary-container/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-sm">upload_file</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[8px] uppercase tracking-wider font-bold">Results Uploaded</p>
                  <p className="font-numeric-bold text-base font-bold text-on-surface mt-0.5">14</p>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between h-28">
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed-dim/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-sm">description</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[8px] uppercase tracking-wider font-bold">Homeworks Assigned</p>
                  <p className="font-numeric-bold text-base font-bold text-on-surface mt-0.5">5</p>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between h-28">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">event_available</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[8px] uppercase tracking-wider font-bold">Personal Attendance</p>
                  <p className="font-numeric-bold text-base font-bold text-on-surface mt-0.5">98%</p>
                </div>
              </div>
            </section>

            {/* Performance Summary & Chart */}
            <section className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-3xl shadow-sm space-y-3">
                <h4 className="font-title-lg text-[10px] text-on-surface font-bold uppercase tracking-wider">Performance Summary</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Consistently demonstrates exceptional instructional leadership in Pure Mathematics and Statistics. Her students have shown a 15% increase in standardized test scores this semester. She actively contributes to the digital transformation of teaching materials, maintaining one of the highest repository engagement rates in the department.
                </p>
              </div>

              <div className="bg-primary-container/10 border border-primary-container/20 p-5 rounded-3xl flex flex-col justify-between h-48">
                <h4 className="font-title-lg text-[10px] text-primary font-bold uppercase tracking-wider">Result Trends</h4>
                <div className="flex items-end gap-1.5 h-16 mt-2">
                  <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '60%' }}></div>
                  <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '75%' }}></div>
                  <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '65%' }}></div>
                  <div className="w-full bg-primary/45 rounded-t transition-all hover:bg-primary" style={{ height: '85%' }}></div>
                  <div className="w-full bg-primary rounded-t transition-all hover:bg-primary" style={{ height: '95%' }}></div>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] text-primary font-bold">Semesters 1 - 5</p>
                </div>
              </div>
            </section>

            {/* Credentials Panel */}
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low/40">
                <h4 className="font-title-lg text-[10px] text-on-surface font-bold uppercase tracking-wider">Professional Credentials</h4>
              </div>
              <div className="p-5 grid gap-6 md:grid-cols-2">
                <div className="flex gap-3">
                  <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">school</span>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Academic Qualifications</p>
                    <div className="space-y-1 mt-1 text-xs font-semibold text-on-surface">
                      {qualifications.map((q, idx) => (
                        <p key={idx}>{q}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">mail</span>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Contact Information</p>
                    <p className="text-xs font-bold text-on-surface mt-1">{user?.email || 'teacher@educore.com'}</p>
                    <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{user?.phone || '+91 98765 43210'}</p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* View 3: Account Credentials */}
        {activeView === 'profile-details' && (
          <section className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/35 space-y-4 animate-scaleIn">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Account Credentials</h3>
              <button 
                onClick={() => setActiveView('menu')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                <span>Back</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-on-surface-variant uppercase">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-on-surface-variant uppercase">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-on-surface-variant uppercase">Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold outline-none focus:border-primary"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:bg-opacity-95 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </section>
        )}

        {/* View 4: Preferences */}
        {activeView === 'preferences' && (
          <section className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/35 space-y-4 animate-scaleIn">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Toggles & Alerts</h3>
              <button 
                onClick={() => setActiveView('menu')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                <span>Back</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-2">
                <div>
                  <p className="font-bold text-on-surface text-xs">Push Notifications</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Receive real-time alerts & broadcasts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={pushEnabled} 
                    onChange={() => setPushEnabled(!pushEnabled)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary animate-fadeIn"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-2 border-t border-outline-variant/15 pt-4">
                <div>
                  <p className="font-bold text-on-surface text-xs">Email Alerts</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Weekly institutional summary reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailEnabled} 
                    onChange={() => setEmailEnabled(!emailEnabled)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary animate-fadeIn"></div>
                </label>
              </div>
            </div>
          </section>
        )}

        {/* View 5: Switch Profile */}
        {activeView === 'switch-profile' && user?.role === 'teacher' && (
          <section className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/35 space-y-4 animate-scaleIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Saved Roster Swaps</h3>
              <button 
                onClick={() => setActiveView('menu')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                <span>Back</span>
              </button>
            </div>

            <div className="space-y-3">
              {savedAccounts.length === 0 ? (
                <p className="text-xs text-on-surface-variant font-medium">No other saved accounts found.</p>
              ) : (
                <div className="space-y-2.5">
                  {savedAccounts.map(acc => (
                    <div 
                      key={acc.user_id}
                      onClick={() => handleSwitchProfile(acc.user_id)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-extrabold text-xs uppercase">
                        {acc.full_name?.[0] || 'U'}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">{acc.full_name}</h4>
                        <p className="text-[9px] text-outline font-semibold uppercase">{acc.role}</p>
                      </div>
                      <span className="material-symbols-outlined text-outline text-base group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                    </div>
                  ))}
                </div>
              )}
              
              <button 
                onClick={handleAddNewAccount}
                className="w-full flex items-center justify-center gap-1.5 mt-2 py-2.5 border border-dashed border-primary/40 hover:bg-primary/5 rounded-xl transition-colors text-xs font-bold text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Add Existing Account</span>
              </button>
            </div>
          </section>
        )}

        {/* View 6: Help & Support */}
        {activeView === 'support' && (
          <section className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/35 space-y-4 animate-scaleIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Help Documentation</h3>
              <button 
                onClick={() => setActiveView('menu')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                <span>Back</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <h5 className="font-bold text-on-surface">FAQ Support Center</h5>
                <p className="text-[10px] text-on-surface-variant mt-1">Open direct ticket queries or review documentation online.</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <h5 className="font-bold text-on-surface">System Details</h5>
                <p className="text-[10px] text-on-surface-variant mt-1">Version: 1.2.0 Premium Platform</p>
              </div>
            </div>
          </section>
        )}

      </div>
    </DashboardLayout>
  )
}
