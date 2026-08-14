// Drop-in replacement for `<input type="date">` that only allows picking a
// date from the native calendar — typing or pasting a date string directly
// is blocked, since free-typed dates are error-prone (e.g. ambiguous
// day/month order) and the calendar is the only supported way to set one.
export default function DateInput({ onKeyDown, onPaste, ...rest }) {
  return (
    <input
      type="date"
      onKeyDown={(e) => {
        e.preventDefault()
        onKeyDown?.(e)
      }}
      onPaste={(e) => {
        e.preventDefault()
        onPaste?.(e)
      }}
      {...rest}
    />
  )
}
