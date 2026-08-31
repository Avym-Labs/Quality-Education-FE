import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'
import Icon from '../../components/common/Icon'
import DateInput from '../../components/common/DateInput'

export default function AdminManagement() {
  const { t } = useTranslation()
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
  const [schoolName, setSchoolName] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/superadmin/admins')
      setAdmins(data)
    } catch (err) {
      setError(t('adminManagement.failedToFetch'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleDelete = async (adminId) => {
    if (!window.confirm(t('adminManagement.confirmDelete'))) return
    try {
      await api.delete(`/superadmin/admins/${adminId}`)
      setAdmins(admins.filter((admin) => admin.id !== adminId))
    } catch (err) {
      alert(t('adminManagement.failedToDelete'))
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
      alert(t('adminManagement.failedToActivate'))
      console.error(err)
    }
  }

  const confirmPauseAccount = async () => {
    if (pauseOption === 'custom' && !pauseUntilDate) {
      alert(t('adminManagement.selectCustomDate'))
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
      alert(t('adminManagement.failedToPause'))
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
    setSchoolName('')
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
          password,
          school_name: schoolName
        })
      }
      setIsModalOpen(false)
      fetchAdmins()
    } catch (err) {
      setFormError(err.response?.data?.detail || t('adminManagement.failedToSubmit'))
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
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">{t('adminManagement.title')}</h2>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold hover:shadow-md cursor-pointer active:scale-95 transition-all border-none"
          >
            <Icon name="add" className="text-[16px]" />
            <span>{t('adminManagement.createAdmin')}</span>
          </button>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            <Icon name="error" className="text-sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Admins Table */}
        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <Icon name="progress_activity" className="animate-spin text-primary text-3xl" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <Icon name="shield" className="text-outline text-5xl" />
            <p className="text-sm text-on-surface-variant font-semibold mt-2">{t('adminManagement.noAdminAccountsFound')}</p>
          </div>
        ) : (
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/35 shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/25">
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.name')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.school')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.email')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.phone')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.status')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase text-right">{t('adminManagement.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="p-4 text-xs font-bold text-on-surface">{admin.full_name}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{admin.school_name || t('adminManagement.notAvailable')}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{admin.email}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{admin.phone}</td>
                      <td className="p-4 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                          admin.is_active 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-red-50 text-error border-red-200'
                        }`}>
                          {admin.is_active ? t('adminManagement.active') : t('adminManagement.paused')}
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
                            title={admin.is_active ? t('adminManagement.pauseAccount') : t('adminManagement.activateAccount')}
                          >
                            <Icon name={admin.is_active ? 'pause_circle' : 'play_circle'} className="text-[18px]" />
                          </button>
                          
                          {/* Edit button */}
                          <button 
                            onClick={() => handleOpenEditModal(admin)}
                            className="text-primary hover:bg-primary-fixed/20 p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer flex items-center justify-center border-none"
                            title={t('adminManagement.editAdminCredentials')}
                          >
                            <Icon name="edit" className="text-[18px]" />
                          </button>

                          {/* Delete button */}
                          <button 
                            onClick={() => handleDelete(admin.id)}
                            className="text-error hover:bg-red-50 p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer flex items-center justify-center border-none"
                            title={t('adminManagement.deleteAdmin')}
                          >
                            <Icon name="delete" className="text-[18px]" />
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
                  {editingAdmin ? t('adminManagement.editAdministrator') : t('adminManagement.newAdministrator')}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container border-none bg-transparent"
                >
                  <Icon name="close" />
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl text-error text-xs font-semibold mb-4">
                  <Icon name="error" className="text-xs" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.firstName')} <span className="text-error">*</span></label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.lastName')} <span className="text-error">*</span></label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                      required
                    />
                  </div>
                </div>

                {!editingAdmin && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.schoolName')} <span className="text-error">*</span></label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.emailAddress')} <span className="text-error">*</span></label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-transparent text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.phoneNumber')} <span className="text-error">*</span></label>
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
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('adminManagement.password')} {!editingAdmin && <span className="text-error">*</span>}</label>
                    {editingAdmin && (
                      <span className="text-[9px] text-outline font-semibold uppercase italic">{t('adminManagement.leaveBlankToKeep')}</span>
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
                    {formSubmitting ? t('adminManagement.saving') : editingAdmin ? t('adminManagement.saveChanges') : t('adminManagement.createAccount')}
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
                <h3 className="font-title-lg text-base text-on-surface font-bold">{t('adminManagement.pauseAccountTitle')}</h3>
                <button 
                  onClick={() => setPauseModalOpen(false)}
                  className="text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container border-none bg-transparent"
                >
                  <Icon name="close" />
                </button>
              </div>

              <p className="text-xs text-on-surface-variant mb-4 font-semibold">
                {t('adminManagement.selectPauseDuration', { name: pausingAdmin.full_name })}
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
                    <p className="text-xs font-bold text-on-surface">{t('adminManagement.pauseTillUnpaused')}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{t('adminManagement.pauseTillUnpausedDesc')}</p>
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
                    <p className="text-xs font-bold text-on-surface">{t('adminManagement.pauseUntilCustomDate')}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 mb-2">{t('adminManagement.pauseUntilCustomDateDesc')}</p>
                    
                    {pauseOption === 'custom' && (
                      <DateInput
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
                  {t('adminManagement.cancel')}
                </button>
                <button 
                  type="button"
                  onClick={confirmPauseAccount}
                  className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer border-none"
                >
                  {t('adminManagement.pauseAccount')}
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
                  <Icon name="play_circle" />
                  <span>{t('adminManagement.reactivateAccount')}</span>
                </h3>
                <button 
                  onClick={() => setUnpauseModalOpen(false)}
                  className="text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container border-none bg-transparent"
                >
                  <Icon name="close" />
                </button>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-semibold">
                {t('adminManagement.confirmActivate', { name: unpausingAdmin.full_name })}
              </p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-semibold flex items-start gap-2">
                <Icon name="info" className="text-sm mt-0.5" />
                <span>{t('adminManagement.restoreAccessNote')}</span>
              </p>

              <div className="flex gap-2 justify-end pt-4 border-t border-outline-variant/15 mt-5">
                <button 
                  type="button" 
                  onClick={() => setUnpauseModalOpen(false)}
                  className="px-4 py-2 border border-outline text-xs text-on-surface-variant rounded-xl cursor-pointer bg-transparent"
                >
                  {t('adminManagement.cancel')}
                </button>
                <button 
                  type="button"
                  onClick={confirmUnpauseAccount}
                  className="px-5 py-2 bg-primary text-on-primary text-xs rounded-xl font-bold hover:shadow-md cursor-pointer border-none"
                >
                  {t('adminManagement.confirmReactivation')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
