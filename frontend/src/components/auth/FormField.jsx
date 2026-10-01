import { useState } from 'react'
export default function FormField({
  label,
  name,
  error,
  type = 'text',
  hint,
  ...props
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="customer-field">
      <label htmlFor={name}>{label}</label>
      <div className={type === 'password' ? 'password-input' : undefined}>
        <input
          id={name}
          name={name}
          type={type === 'password' && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? name + '-error' : hint ? name + '-hint' : undefined
          }
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {hint && <small id={name + '-hint'}>{hint}</small>}
      {error && (
        <small className="field-error" id={name + '-error'}>
          {error}
        </small>
      )}
    </div>
  )
}
