import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Toggle States
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)

  // Edit Profile form state
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(user?.first_name || 'Alex')
  const [lastName, setLastName] = useState(user?.last_name || 'Rivers')
  const [phone, setPhone] = useState(user?.phone || '1234567890')
  const [submitting, setSubmitting] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Mock local storage update since we don't have a direct profile edit endpoint for all roles
      const updatedUser = {
        ...user,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setIsEditing(false)
      // Refresh page or let user know
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const roleLabel = (() => {
    switch (user?.role) {
      case 'admin': return 'Lead Administrator'
      case 'teacher': return 'Department Faculty'
      default: return 'Active Student'
    }
  })()

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 max-w-2xl mx-auto">
        
        {/* Top Header */}
        <section className="flex items-center gap-stack-md pb-2 border-b border-outline-variant/20">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Settings</h2>
        </section>

        {/* Profile Card */}
        <section className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-sm border border-outline-variant/35">
          <div className="flex items-center justify-between mb-4 border-b border-outline-variant/15 pb-2">
            <h3 className="font-title-lg text-sm text-on-surface font-bold">Profile Details</h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-primary font-bold text-xs hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-outline bg-surface-container-low text-xs outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-outline bg-surface-container-low text-xs outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-outline bg-surface-container-low text-xs outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs border border-outline text-on-surface-variant rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs bg-primary text-on-primary rounded-lg font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative group">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-outline-variant ring-4 ring-primary-container" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-fixed border border-outline-variant flex items-center justify-center font-bold text-primary text-xl">
                    {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'R'}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-base text-on-surface">
                  {user?.full_name || `${firstName} ${lastName}`}
                </h4>
                <p className="text-xs text-on-surface-variant font-medium">{roleLabel}</p>
                <p className="text-[11px] text-outline font-semibold mt-0.5">{user?.email || 'alex.rivers@edustream.edu'}</p>
              </div>
            </div>
          )}
        </section>

        {/* Security & Access Section */}
        <section className="space-y-stack-sm mt-6">
          <h3 className="px-1 text-[11px] font-bold text-primary uppercase tracking-wider">Security & Access</h3>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/35">
            
            {/* Password Row */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">lock</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-on-surface">Change Password</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Update account security credentials</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform">chevron_right</span>
            </button>
            <div className="mx-4 h-px bg-outline-variant/15"></div>
            
            {/* Language Row */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">language</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-on-surface">Language</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">English (United States)</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform">chevron_right</span>
            </button>

          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-stack-sm mt-6">
          <h3 className="px-1 text-[11px] font-bold text-primary uppercase tracking-wider">Preferences</h3>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/35">
            
            {/* Push Notifications Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">notifications_active</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Push Notifications</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Receive real-time alerts & broadcasts</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={pushEnabled} 
                  onChange={() => setPushEnabled(!pushEnabled)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="mx-4 h-px bg-outline-variant/15"></div>

            {/* Email Alerts Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">mail</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Email Alerts</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Weekly institutional summary reports</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailEnabled} 
                  onChange={() => setEmailEnabled(!emailEnabled)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

          </div>
        </section>

        {/* Help & Support Section */}
        <section className="space-y-stack-sm mt-6">
          <h3 className="px-1 text-[11px] font-bold text-primary uppercase tracking-wider">Help & Support</h3>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/35">
            
            <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">help_center</span>
                </div>
                <p className="text-sm font-semibold text-on-surface">FAQ Support Center</p>
              </div>
              <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
            </button>
            <div className="mx-4 h-px bg-outline-variant/15"></div>

            <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">support_agent</span>
                </div>
                <p className="text-sm font-semibold text-on-surface">Contact Administrator</p>
              </div>
              <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
            </button>
            <div className="mx-4 h-px bg-outline-variant/15"></div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">info</span>
                </div>
                <p className="text-sm font-semibold text-on-surface">System Version</p>
              </div>
              <span className="font-semibold text-xs text-outline">1.2.0 Premium</span>
            </div>

          </div>
        </section>

        {/* Logout Trigger */}
        <section className="pt-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-error text-on-error py-3.5 rounded-2xl shadow-md hover:bg-opacity-90 transition-all active:scale-95 font-bold text-sm hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Logout Account</span>
          </button>
          <p className="text-center mt-4 text-[10px] font-semibold text-outline uppercase tracking-wider">
            EduCore School Management System © 2026
          </p>
        </section>

      </div>
    </DashboardLayout>
  )
}
