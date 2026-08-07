// Shared dd/mm/yyyy date formatting used across the app instead of the
// browser-locale-dependent toLocaleDateString('en-US') (which renders
// mm/dd/yyyy and varies by machine locale).
export function formatDateDMY(dateInput) {
  if (!dateInput) return ''
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Same as formatDateDMY but also appends a 24-hour time, e.g. "07/08/2026 14:30"
export function formatDateTimeDMY(dateInput) {
  if (!dateInput) return ''
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${formatDateDMY(d)} ${hours}:${minutes}`
}

// yyyy-mm-dd (for <input type="date"> values) -> dd/mm/yyyy display string,
// without going through the Date/timezone machinery (avoids off-by-one-day
// shifts near midnight in negative UTC offsets).
export function formatIsoDateDMY(isoDateStr) {
  if (!isoDateStr) return ''
  const [year, month, day] = isoDateStr.split('-')
  if (!year || !month || !day) return formatDateDMY(isoDateStr)
  return `${day}/${month}/${year}`
}
