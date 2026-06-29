import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'

export default function SuperAdminSettings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  // Own profile form state
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [isEditingSelf, setIsEditingSelf] = useState(false)
  const [selfSubmitting, setSelfSubmitting] = useState(false)
  const [selfError, setSelfError] = useState('')
  const [selfSuccess, setSelfSuccess] = useState('')

  // Admins management state
  const [admins, setAdmins] = useState([])
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')

  // Fetch admin list
  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/superadmin/admins')
      setAdmins(data)
    } catch (err) {
      console.error('Failed to load administrators', err)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleSelectAdmin = (e) => {
    const id = e.target.value
    setSelectedAdminId(id)
    const selected = admins.find(a => a.id === id)
    if (selected) {
      setAdminEmail(selected.email)
      setAdminPhone(selected.phone)
    } else {
      setAdminEmail('')
      setAdminPhone('')
    }
    setAdminPassword('')
    setAdminSuccess('')
    setAdminError('')
  }

  const handleSaveSelf = async (e) => {
    e.preventDefault()
    setSelfError('')
    setSelfSuccess('')
    setSelfSubmitting(true)
    try {
      const payload = { first_name: firstName, last_name: lastName, email, phone }
      if (password) payload.password = password
      
      await api.put('/superadmin/users/self/credentials', payload)
      
      // Update local storage representation of the user
      const updatedUser = {
        ...user,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email,
        phone
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setSelfSuccess('Profile credentials updated successfully!')
      setIsEditingSelf(false)
      setPassword('')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setSelfError(err.response?.data?.detail || 'Failed to update credentials.')
    } finally {
      setSelfSubmitting(false)
    }
  }

  const handleSaveAdmin = async (e) => {
    e.preventDefault()
    if (!selectedAdminId) return
    setAdminError('')
    setAdminSuccess('')
    setAdminSubmitting(true)
    try {
      const payload = { email: adminEmail, phone: adminPhone }
      if (adminPassword) payload.password = adminPassword
      
      await api.put(`/superadmin/users/${selectedAdminId}/credentials`, payload)
      setAdminSuccess('Admin credentials updated successfully!')
      setAdminPassword('')
      fetchAdmins()
    } catch (err) {
      setAdminError(err.response?.data?.detail || 'Failed to update admin credentials.')
    } finally {
      setAdminSubmitting(false)
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
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">System Settings</h2>
        </section>

        {/* Section 1: Super Admin Profile Settings */}
        <section className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-sm border border-outline-variant/35">
          <div className="flex items-center justify-between mb-4 border-b border-outline-variant/15 pb-2">
            <h3 className="font-title-lg text-sm text-on-surface font-bold">My Credentials</h3>
            {!isEditingSelf && (
              <button 
                onClick={() => setIsEditingSelf(true)}
                className="flex items-center gap-1 text-primary font-bold text-xs hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {selfError && (
            <div className="p-3 bg-error-container rounded-xl text-error text-xs font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">error</span>
              <span>{selfError}</span>
            </div>
          )}

          {selfSuccess && (
            <div className="p-3 bg-green-50 rounded-xl text-green-700 text-xs font-bold mb-3 flex items-center gap-2 border border-green-200">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span>{selfSuccess}</span>
            </div>
          )}

          {isEditingSelf ? (
            <form onSubmit={handleSaveSelf} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">New Password (optional)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-outline-variant/15">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingSelf(false)
                    setFirstName(user?.first_name || '')
                    setLastName(user?.last_name || '')
                    setEmail(user?.email || '')
                    setPhone(user?.phone || '')
                    setPassword('')
                  }}
                  className="px-4 py-2 border border-outline text-xs text-on-surface-variant rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={selfSubmitting}
                  className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer"
                >
                  {selfSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-fixed border border-outline-variant flex items-center justify-center font-bold text-primary text-xl">
                {user?.first_name?.[0] || 'S'}{user?.last_name?.[0] || 'A'}
              </div>
              <div>
                <h4 className="font-bold text-base text-on-surface">
                  {user?.full_name || 'Super Admin'}
                </h4>
                <p className="text-xs text-on-surface-variant font-medium">Platform Super Administrator</p>
                <p className="text-[11px] text-outline font-semibold mt-0.5">{user?.email || 'superadmin@educore.com'}</p>
                <p className="text-[11px] text-outline font-semibold">{user?.phone || '0000000000'}</p>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Manage Admin Credentials */}
        <section className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-sm border border-outline-variant/35">
          <div className="flex items-center justify-between mb-4 border-b border-outline-variant/15 pb-2">
            <h3 className="font-title-lg text-sm text-on-surface font-bold">Admin Credentials</h3>
          </div>

          {adminError && (
            <div className="p-3 bg-error-container rounded-xl text-error text-xs font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">error</span>
              <span>{adminError}</span>
            </div>
          )}

          {adminSuccess && (
            <div className="p-3 bg-green-50 rounded-xl text-green-700 text-xs font-bold mb-3 flex items-center gap-2 border border-green-200">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span>{adminSuccess}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 mb-4">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">Select Administrator Account</label>
            <select
              value={selectedAdminId}
              onChange={handleSelectAdmin}
              className="w-full px-3 py-2 border border-outline-variant rounded-xl bg-surface-container-lowest text-xs outline-none focus:border-primary cursor-pointer"
            >
              <option value="">-- Select an Admin --</option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>{admin.full_name} ({admin.email})</option>
              ))}
            </select>
          </div>

          {selectedAdminId && (
            <form onSubmit={handleSaveAdmin} className="space-y-4 pt-3 border-t border-outline-variant/15">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Admin Email Address</label>
                <input 
                  type="email" 
                  value={adminEmail} 
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Admin Phone Number</label>
                <input 
                  type="text" 
                  value={adminPhone} 
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Update Password (optional)</label>
                <input 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter new password to change"
                  className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={adminSubmitting}
                  className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer"
                >
                  {adminSubmitting ? 'Updating...' : 'Update Admin Credentials'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Logout Section */}
        <section className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-error text-on-error py-3.5 rounded-2xl shadow-md hover:bg-opacity-90 transition-all active:scale-95 font-bold text-sm"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Logout Account</span>
          </button>
        </section>

      </div>
    </DashboardLayout>
  )
}
