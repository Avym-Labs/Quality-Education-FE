import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LanguageToggle({ light = false }) {
  const { user, changeLanguage } = useAuth()
  const [saving, setSaving] = useState(false)
  const isGujarati = (user?.preferred_language || 'en') === 'gu'

  const handleToggle = async () => {
    if (saving) return
    setSaving(true)
    try {
      await changeLanguage(isGujarati ? 'en' : 'gu')
    } catch (err) {
      console.error('Language switch failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const activeColor = light ? 'text-white' : 'text-primary'
  const inactiveColor = light ? 'text-white/50' : 'text-outline'
  const trackInactive = light ? 'bg-white/30' : 'bg-surface-container-highest'

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      aria-label="Toggle language"
    >
      <span className={`text-[10px] font-bold transition-colors ${!isGujarati ? activeColor : inactiveColor}`}>EN</span>
      <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isGujarati ? 'bg-primary' : trackInactive}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${isGujarati ? 'left-5' : 'left-0.5'}`} />
      </div>
      <span className={`text-[10px] font-bold transition-colors ${isGujarati ? activeColor : inactiveColor}`}>GU</span>
    </button>
  )
}
