import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Icon from './Icon'

const LANGUAGES = [
  { code: 'en', labelKey: 'language.english', native: 'English' },
  { code: 'gu', labelKey: 'language.gujarati', native: 'ગુજરાતી' },
]

export default function LanguageSelector() {
  const { t } = useTranslation()
  const { user, changeLanguage } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const active = user?.preferred_language || 'en'

  const handleSelect = async (code) => {
    if (code === active || saving) return
    setSaving(true)
    setError('')
    try {
      await changeLanguage(code)
    } catch (err) {
      console.error('Failed to update language:', err)
      setError(t('language.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="translate" className="text-primary text-base" />
        <p className="font-bold text-on-surface text-xs">{t('language.sectionTitle')}</p>
      </div>
      <p className="text-[10px] text-on-surface-variant font-medium mb-3">{t('language.sectionSubtitle')}</p>

      <div className="grid grid-cols-2 gap-2">
        {LANGUAGES.map(lang => {
          const isActive = active === lang.code
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              disabled={saving}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-60 ${
                isActive
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              {isActive && <Icon name="check_circle" className="text-sm" filled />}
              <span>{lang.native}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-[10px] text-error font-semibold mt-2">{error}</p>}
    </div>
  )
}
