import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null) // null = Create, object = Edit
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/superadmin/admins')
      setAdmins(data)
    } catch (err) {
      setError('Failed to fetch administrator accounts.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this Administrator account?')) return
    try {
      await api.delete(`/superadmin/admins/${adminId}`)
      setAdmins(admins.filter((admin) => admin.id !== adminId))
    } catch (err) {
      alert('Failed to delete administrator account.')
      console.error(err)
    }
  }

  // Pause Modal Option States
  const [pauseModalOpen, setPauseModalOpen] = useState(false)
  const [pausingAdmin, setPausingAdmin] = useState(null)
  const [pauseOption, setPauseOption] = useState('indefinite') // 'indefinite' | 'custom'
  const [pauseUntilDate, setPauseUntilDate] = useState('')

  // Unpause Modal Confirmation States
  const [unpauseModalOpen, setUnpauseModalOpen] = useState(false)
  const [unpausingAdmin, setUnpausingAdmin] = useState(null)

  const handleToggleStatus = async (admin) => {
    if (admin.is_active) {
      // Open Pause Modal if active (suspension duration popup)
      setPausingAdmin(admin)
      setPauseOption('indefinite')
      setPauseUntilDate('')
      setPauseModalOpen(true)
    } else {
      // Open Custom Unpause Confirmation Modal if paused
      setUnpausingAdmin(admin)
      setUnpauseModalOpen(true)
    }
  }

  const confirmUnpauseAccount = async () => {
    try {
      await api.put(`/superadmin/admins/${unpausingAdmin.id}/status`, { is_active: true })
      setUnpauseModalOpen(false)
      fetchAdmins()
    } catch (err) {
      alert('Failed to activate administrator account.')
      console.error(err)
    }
  }

  const confirmPauseAccount = async () => {
    if (pauseOption === 'custom' && !pauseUntilDate) {
      alert('Please select a custom reactivation date.')
      return
    }
    
    try {
      const payload = {
        is_active: false,
        paused_until: pauseOption === 'custom' ? pauseUntilDate : null
      }
      await api.put(`/superadmin/admins/${pausingAdmin.id}/status`, payload)
      setPauseModalOpen(false)
      fetchAdmins()
    } catch (err) {
      alert('Failed to pause administrator account.')
      console.error(err)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingAdmin(null)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (admin) => {
    setEditingAdmin(admin)
    setFirstName(admin.first_name || '')
    setLastName(admin.last_name || '')
    setEmail(admin.email || '')
    setPhone(admin.phone || '')
    setPassword('') // keep empty unless updating
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)
    try {
      if (editingAdmin) {
        // Edit Mode
        const payload = {
          first_name: firstName,
          last_name: lastName,
          email,
          phone
        }
        if (password) payload.password = password
        
        await api.put(`/superadmin/users/${editingAdmin.id}/credentials`, payload)
      } else {
        // Create Mode
        await api.post('/superadmin/admins', {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password
        })
      }
      setIsModalOpen(false)
      fetchAdmins()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to submit administrator request. Try again.')
      console.error(err)
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md">
        
        {/* Header */}
        <section className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Admin Management</h2>
            <p className="text-xs text-on-surface-variant font-medium">Create, edit, pause or oversee administrator access privileges.</p>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold hover:shadow-md cursor-pointer active:scale-95 transition-all border-none"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Create Admin</span>
          </button>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Admins Table */}
        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <span className="material-symbols-outlined text-outline text-5xl">shield</span>
            <p className="text-sm text-on-surface-variant font-semibold mt-2">No Admin accounts found</p>
          </div>
        ) : (
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/35 shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/25">
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Name</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Email</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Phone</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Status</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="p-4 text-xs font-bold text-on-surface">{admin.full_name}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{admin.email}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{admin.phone}</td>
                      <td className="p-4 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                          admin.is_active 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-red-50 text-error border-red-200'
                        }`}>
                          {admin.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Toggle Active status */}
                          <button 
                            onClick={() => handleToggleStatus(admin)}
                            className={`p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer flex items-center justify-center border-none ${
                              admin.is_active 
                                ? 'text-amber-600 hover:bg-amber-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={admin.is_active ? "Pause Account" : "Activate Account"}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {admin.is_active ? 'pause_circle' : 'play_circle'}
                            </span>
                          </button>
                          
                          {/* Edit button */}
                          <button 
                            onClick={() => handleOpenEditModal(admin)}
                            className="text-primary hover:bg-primary-fixed/20 p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer flex items-center justify-center border-none"
                            title="Edit Admin Credentials"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          {/* Delete button */}
                          <button 
                            onClick={() => handleDelete(admin.id)}
                            className="text-error hover:bg-red-50 p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer flex items-center justify-center border-none"
                            title="Delete Admin"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Create / Edit Admin Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-xl border border-outline-variant/40 animate-fade-in text-left">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15 mb-4">
                <h3 className="font-title-lg text-base text-on-surface font-bold">
                  {editingAdmin ? 'Edit Administrator' : 'New Administrator'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container border-none bg-transparent"
                >
                  close
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl text-error text-xs font-semibold mb-4">
                  <span className="material-symbols-outlined text-xs">error</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
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
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Password</label>
                    {editingAdmin && (
                      <span className="text-[9px] text-outline font-semibold uppercase italic">(leave blank to keep current)</span>
                    )}
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                    minLength={6}
                    required={!editingAdmin}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-outline-variant/15">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-outline text-xs text-on-surface-variant rounded-xl cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer disabled:opacity-50 border-none"
                  >
                    {formSubmitting ? 'Saving...' : editingAdmin ? 'Save Changes' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pause Option Modal */}
        {pauseModalOpen && pausingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-xl border border-outline-variant/40 animate-fade-in text-left">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15 mb-4">
                <h3 className="font-title-lg text-base text-on-surface font-bold">Pause Account</h3>
                <button 
                  onClick={() => setPauseModalOpen(false)}
                  className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container border-none bg-transparent"
                >
                  close
                </button>
              </div>

              <p className="text-xs text-on-surface-variant mb-4 font-semibold">
                Select the pause duration for <strong>{pausingAdmin.full_name}</strong>. Teachers and students under this admin will also be suspended.
              </p>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/10 cursor-pointer hover:bg-surface-container-low transition-all">
                  <input 
                    type="radio" 
                    name="pause_opt" 
                    checked={pauseOption === 'indefinite'}
                    onChange={() => setPauseOption('indefinite')}
                    className="w-4 h-4 text-primary focus:ring-primary mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-on-surface">Pause till unpaused</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Keep the account paused indefinitely until manually activated.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/10 cursor-pointer hover:bg-surface-container-low transition-all">
                  <input 
                    type="radio" 
                    name="pause_opt" 
                    checked={pauseOption === 'custom'}
                    onChange={() => setPauseOption('custom')}
                    className="w-4 h-4 text-primary focus:ring-primary mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface">Pause until custom date</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 mb-2">Set a specific date when the account will automatically reactivate.</p>
                    
                    {pauseOption === 'custom' && (
                      <input 
                        type="date"
                        value={pauseUntilDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setPauseUntilDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs font-semibold focus:border-primary outline-none"
                      />
                    )}
                  </div>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-outline-variant/15 mt-4">
                <button 
                  type="button" 
                  onClick={() => setPauseModalOpen(false)}
                  className="px-4 py-2 border border-outline text-xs text-on-surface-variant rounded-xl cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={confirmPauseAccount}
                  className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer border-none"
                >
                  Pause Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unpause Confirmation Modal */}
        {unpauseModalOpen && unpausingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-xl border border-outline-variant/40 animate-fade-in text-left">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15 mb-4">
                <h3 className="font-title-lg text-base text-on-surface font-bold flex items-center gap-1.5 text-emerald-800">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Reactivate Account</span>
                </h3>
                <button 
                  onClick={() => setUnpauseModalOpen(false)}
                  className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container border-none bg-transparent"
                >
                  close
                </button>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-semibold">
                Are you sure you want to activate the administrator account for <strong>{unpausingAdmin.full_name}</strong>?
              </p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-semibold flex items-start gap-2">
                <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                <span>This will immediately restore access privileges for all teacher and student accounts under this institution.</span>
              </p>

              <div className="flex gap-2 justify-end pt-4 border-t border-outline-variant/15 mt-5">
                <button 
                  type="button" 
                  onClick={() => setUnpauseModalOpen(false)}
                  className="px-4 py-2 border border-outline text-xs text-on-surface-variant rounded-xl cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={confirmUnpauseAccount}
                  className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer border-none"
                >
                  Confirm Reactivation
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
