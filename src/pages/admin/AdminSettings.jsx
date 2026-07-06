import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function AdminSettings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // activeView: 'menu' | 'my-profile' | 'teachers' | 'students' | 'switch-profile'
  const [activeView, setActiveView] = useState('menu')

  const [savedAccounts, setSavedAccounts] = useState([])
  useEffect(() => {
    if (!user) return
    try {
      const roster = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      const others = roster.filter(r => r.user_id !== user.id)
      setSavedAccounts(others)
    } catch (err) {
      console.error('Failed to load accounts in AdminSettings:', err)
    }
  }, [user])
  const [message, setMessage] = useState('')

  // Own Profile state
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [submittingSelf, setSubmittingSelf] = useState(false)

  // Teachers State
  const [teachers, setTeachers] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [teacherEmail, setTeacherEmail] = useState('')
  const [teacherPhone, setTeacherPhone] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [submittingTeacher, setSubmittingTeacher] = useState(false)

  // Students State
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [studentPassword, setStudentPassword] = useState('')
  const [submittingStudent, setSubmittingStudent] = useState(false)

  // Fetch Lists
  const loadFacultyAndStudents = async () => {
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/students')
      ])
      setTeachers(teachersRes.data || [])
      setStudents(studentsRes.data || [])
    } catch (err) {
      console.error('Failed to load rosters:', err)
    }
  }

  useEffect(() => {
    loadFacultyAndStudents()
  }, [])

  // Handle Teacher Select Change
  const handleTeacherChange = (e) => {
    const id = e.target.value
    setSelectedTeacherId(id)
    const selected = teachers.find(t => t.id === id)
    if (selected) {
      setTeacherEmail(selected.email || '')
      setTeacherPhone(selected.phone || '')
    } else {
      setTeacherEmail('')
      setTeacherPhone('')
    }
    setTeacherPassword('')
  }

  // Handle Student Select Change
  const handleStudentChange = (e) => {
    const id = e.target.value
    setSelectedStudentId(id)
    const selected = students.find(s => s.id === id)
    if (selected) {
      setStudentEmail(selected.email || '')
      setStudentPhone(selected.phone || '')
    } else {
      setStudentEmail('')
      setStudentPhone('')
    }
    setStudentPassword('')
  }

  // Save Self
  const handleSaveSelf = async (e) => {
    e.preventDefault()
    setSubmittingSelf(true)
    setMessage('')
    try {
      const payload = { email, phone }
      if (password) payload.password = password

      // Update backend user credentials
      await api.put(`/admin/users/${user.id}/credentials`, payload)
      
      // Update local storage user metadata
      const updatedUser = {
        ...user,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email,
        phone
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setMessage('Profile updated successfully!')
      setPassword('')
      
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.detail || 'Failed to save settings.')
    } finally {
      setSubmittingSelf(false)
    }
  }

  // Save Teacher credentials
  const handleSaveTeacherCreds = async (e) => {
    e.preventDefault()
    if (!selectedTeacherId) return
    const selected = teachers.find(t => t.id === selectedTeacherId)
    if (!selected) return

    setSubmittingTeacher(true)
    setMessage('')
    try {
      const payload = { email: teacherEmail, phone: teacherPhone }
      if (teacherPassword) payload.password = teacherPassword

      await api.put(`/admin/users/${selected.user_id}/credentials`, payload)
      setMessage('Teacher credentials updated successfully!')
      setTeacherPassword('')
      loadFacultyAndStudents()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.detail || 'Failed to update teacher credentials.')
    } finally {
      setSubmittingTeacher(false)
    }
  }

  // Save Student credentials
  const handleSaveStudentCreds = async (e) => {
    e.preventDefault()
    if (!selectedStudentId) return
    const selected = students.find(s => s.id === selectedStudentId)
    if (!selected) return

    setSubmittingStudent(true)
    setMessage('')
    try {
      const payload = { email: studentEmail, phone: studentPhone }
      if (studentPassword) payload.password = studentPassword

      await api.put(`/admin/users/${selected.user_id}/credentials`, payload)
      setMessage('Student credentials updated successfully!')
      setStudentPassword('')
      loadFacultyAndStudents()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.detail || 'Failed to update student credentials.')
    } finally {
      setSubmittingStudent(false)
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

  const handleSwitchProfile = async (targetUserId) => {
    try {
      const roster = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      const match = roster.find(r => r.user_id === targetUserId)
      if (!match) return

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
      }
      currentRoster.push(currentSavedUser)
      localStorage.setItem('educore_saved_accounts', JSON.stringify(currentRoster))

      localStorage.setItem('access_token', match.access_token)
      localStorage.setItem('refresh_token', match.refresh_token)
      localStorage.setItem('user', JSON.stringify(match.user_data || {
        id: match.user_id,
        email: match.email,
        phone: match.phone,
        role: match.role,
        first_name: match.first_name,
        last_name: match.last_name,
        full_name: match.full_name,
        avatar: match.avatar,
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
      })
      localStorage.setItem('educore_saved_accounts', JSON.stringify(currentRoster))

      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')

      navigate('/login')
      window.location.reload()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 max-w-xl mx-auto">
        
        {/* Header */}
        <section className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (activeView !== 'menu') {
                  setActiveView('menu')
                } else {
                  navigate('/admin/dashboard')
                }
              }}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                {activeView === 'menu' && 'Account'}
                {activeView === 'my-profile' && 'Account Credentials'}
                {activeView === 'teachers' && 'Faculty Access Control'}
                {activeView === 'students' && 'Student Access Control'}
                {activeView === 'switch-profile' && 'Switch Account'}
              </h2>
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                {activeView === 'menu' && 'Select an account option to manage credentials or switcher profiles.'}
                {activeView === 'my-profile' && 'Edit your administrative login profile.'}
                {activeView === 'teachers' && 'Manage faculty email and password credentials.'}
                {activeView === 'students' && 'Manage student email and password credentials.'}
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className={`p-3 rounded-xl text-center text-xs font-bold mb-4 ${
            message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-primary-container/20 text-primary border border-primary/20'
          }`}>
            {message}
          </div>
        )}

        {/* View 1: Root Menu */}
        {activeView === 'menu' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Account Settings */}
            <div 
              onClick={() => setActiveView('my-profile')}
              className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-on-surface">Account Settings</h4>
                  <p className="text-[10px] text-outline font-semibold">Change your profile name, email, phone, and password</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>

            {/* Faculty Access Control */}
            <div 
              onClick={() => setActiveView('teachers')}
              className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">school</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-on-surface">Faculty Access Control</h4>
                  <p className="text-[10px] text-outline font-semibold">Modify teacher emails, phone numbers, and passwords</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>

            {/* Student Access Control */}
            <div 
              onClick={() => setActiveView('students')}
              className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl">groups</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-on-surface">Student Access Control</h4>
                  <p className="text-[10px] text-outline font-semibold">Modify student emails, phone numbers, and passwords</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>

            {/* Switch Account */}
            <div 
              onClick={() => setActiveView('switch-profile')}
              className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">switch_account</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-on-surface">Switch Account</h4>
                  <p className="text-[10px] text-outline font-semibold">Switch to another saved credentials profile</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>

            {/* Log Out */}
            <div 
              onClick={handleLogout}
              className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl hover:bg-red-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-xl">logout</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-error">Sign Out</h4>
                  <p className="text-[10px] text-red-400 font-semibold mt-0.5">Logout from current administrative account</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-red-300 group-hover:translate-x-0.5 transition-transform text-lg">chevron_right</span>
            </div>
          </div>
        )}

        {/* View 2: My Profile */}
        {activeView === 'my-profile' && (
          <section className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/35 space-y-4 animate-scaleIn">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Edit Credentials</h3>
              <button 
                onClick={() => setActiveView('menu')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                <span>Settings List</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveSelf} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-on-surface-variant uppercase">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-on-surface-variant uppercase">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-on-surface-variant uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-on-surface-variant uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-on-surface-variant uppercase">Change Password</label>
                <input 
                  type="password" 
                  placeholder="Leave blank to keep unchanged"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingSelf}
                className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:bg-opacity-95 cursor-pointer disabled:opacity-50"
              >
                {submittingSelf ? 'Saving credentials...' : 'Save Profile Changes'}
              </button>
            </form>
          </section>
        )}

        {/* View 3: Teachers */}
        {activeView === 'teachers' && (
          <section className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/35 space-y-4 animate-scaleIn">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Faculty Login Administration</h3>
              <button 
                onClick={() => setActiveView('menu')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                <span>Settings List</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveTeacherCreds} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-on-surface-variant uppercase">Select Faculty Member</label>
                <select 
                  value={selectedTeacherId} 
                  onChange={handleTeacherChange}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary cursor-pointer font-semibold"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.department})</option>
                  ))}
                </select>
              </div>

              {selectedTeacherId && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Teacher Email</label>
                      <input 
                        type="email" 
                        value={teacherEmail}
                        onChange={e => setTeacherEmail(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Teacher Phone</label>
                      <input 
                        type="text" 
                        value={teacherPhone}
                        onChange={e => setTeacherPhone(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">New Password</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank to keep unchanged"
                      value={teacherPassword}
                      onChange={e => setTeacherPassword(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingTeacher}
                    className="w-full py-3 bg-secondary text-on-secondary font-bold text-xs rounded-2xl shadow-md hover:bg-opacity-95 cursor-pointer disabled:opacity-50"
                  >
                    {submittingTeacher ? 'Saving...' : 'Update Faculty Credentials'}
                  </button>
                </div>
              )}
            </form>
          </section>
        )}

        {/* View 4: Students */}
        {activeView === 'students' && (
          <section className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/35 space-y-4 animate-scaleIn">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Student Login Administration</h3>
              <button 
                onClick={() => setActiveView('menu')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                <span>Settings List</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveStudentCreds} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-on-surface-variant uppercase">Select Student</label>
                <select 
                  value={selectedStudentId} 
                  onChange={handleStudentChange}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary cursor-pointer font-semibold"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} (Class {s.grade}-{s.section})</option>
                  ))}
                </select>
              </div>

              {selectedStudentId && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Student Email</label>
                      <input 
                        type="email" 
                        value={studentEmail}
                        onChange={e => setStudentEmail(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Student Phone</label>
                      <input 
                        type="text" 
                        value={studentPhone}
                        onChange={e => setStudentPhone(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">New Password</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank to keep unchanged"
                      value={studentPassword}
                      onChange={e => setStudentPassword(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingStudent}
                    className="w-full py-3 bg-secondary text-on-secondary font-bold text-xs rounded-2xl shadow-md hover:bg-opacity-95 cursor-pointer disabled:opacity-50"
                  >
                    {submittingStudent ? 'Saving...' : 'Update Student Credentials'}
                  </button>
                </div>
              )}
            </form>
          </section>
        )}

        {/* View 5: Switch Profile */}
        {activeView === 'switch-profile' && (
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

      </div>
    </DashboardLayout>
  )
}
