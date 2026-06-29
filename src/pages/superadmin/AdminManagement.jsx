import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)
    try {
      await api.post('/superadmin/admins', {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password
      })
      // Clear form & close modal
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setIsModalOpen(false)
      // Refresh list
      fetchAdmins()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create admin. Try again.')
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
            <p className="text-xs text-on-surface-variant font-medium">Create and oversee administrator access privileges.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold hover:shadow-md cursor-pointer active:scale-95 transition-all"
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
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/35 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/25">
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Name</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Email</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Phone</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 text-xs font-bold text-on-surface">{admin.full_name}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{admin.email}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{admin.phone}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(admin.id)}
                          className="text-error hover:bg-red-50 p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer"
                          title="Delete Admin"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Create Admin Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-xl border border-outline-variant/40 animate-fade-in">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15 mb-4">
                <h3 className="font-title-lg text-base text-on-surface font-bold">New Administrator</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container"
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

              <form onSubmit={handleCreateAdmin} className="space-y-4">
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
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-outline-variant/15">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-outline text-xs text-on-surface-variant rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
