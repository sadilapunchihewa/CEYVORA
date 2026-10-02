import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContextValue'
import { safeReturn } from '../utils/customer'
import FormField from '../components/auth/FormField'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { requestError, validPhone } from '../utils/customer'
export default function AuthPage({ register = false }) {
  const auth = useAuth()
  const location = useLocation()
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const from = location.state?.from
    ? safeReturn(location.state.from)
    : auth.user?.role === 'Admin'
      ? '/admin'
      : '/account'
  if (auth.isAuthenticated) return <Navigate to={from} replace />
  async function submit(event) {
    event.preventDefault()
    if (busy.current) return
    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form))
    const next = {}
    if (
      !fields.email?.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)
    )
      next.email = 'Enter a valid email address.'
    if (!fields.password) next.password = 'Enter your password.'
    if (register) {
      if (!fields.fullName?.trim()) next.fullName = 'Enter your full name.'
      if (
        fields.password.length < 8 ||
        new TextEncoder().encode(fields.password).length > 72 ||
        !/\p{L}/u.test(fields.password) ||
        !/\p{Nd}/u.test(fields.password) ||
        fields.password.includes('\0')
      )
        next.password =
          'Use at least 8 characters, a letter and a number, and no more than 72 UTF-8 bytes.'
      if (fields.confirmPassword !== fields.password)
        next.confirmPassword = 'Passwords must match.'
      if (fields.phone && !validPhone(fields.phone))
        next.phone = 'Enter a valid phone number.'
    }
    setErrors(next)
    setMessage('')
    if (Object.keys(next).length) {
      form.elements[Object.keys(next)[0]]?.focus()
      return
    }
    busy.current = true
    setPending(true)
    try {
      const data = { email: fields.email.trim(), password: fields.password }
      if (register)
        Object.assign(data, {
          fullName: fields.fullName.trim(),
          phone: fields.phone.trim() || null,
          country: fields.country.trim() || null,
        })
      await auth[register ? 'register' : 'login'](data)
    } catch (error) {
      setMessage(
        error.response?.status === 401
          ? 'We couldn’t sign you in. Check your email and password.'
          : error.response?.status === 409
            ? 'We couldn’t create an account with these details. Try signing in or use a different email.'
            : requestError(
                error,
                `We couldn’t ${register ? 'create your account' : 'sign you in'} right now. Please try again.`,
              ),
      )
    } finally {
      form.elements.password.value = ''
      if (register) form.elements.confirmPassword.value = ''
      busy.current = false
      setPending(false)
    }
  }
  return (
    <div className="container auth-layout customer-page">
      <aside className="auth-picture">
        <img
          src="/images/hills.webp"
          alt="Tea harvesting in the Sri Lankan hills"
          fetchPriority="high"
        />
        <div>
          <h2>Your next chapter starts here.</h2>
          <p>Make room for a little Sri Lanka.</p>
        </div>
      </aside>
      <section className="auth-content">
        <h1>{register ? 'Begin your journey' : 'Welcome back'}</h1>
        <p>
          {register
            ? 'Create your Ceyvora account to request a journey and keep your travel plans together.'
            : 'Sign in to return to your travel plans.'}
        </p>
        {auth.loading ? (
          <LoadingSpinner label="Opening your account…" />
        ) : auth.token && auth.error ? (
          <div role="alert">
            <p>We couldn’t load your account. Please try again.</p>
            <Button onClick={auth.refreshUser}>Try again</Button>{' '}
            <Button onClick={auth.logout} variant="outline">
              Sign out
            </Button>
          </div>
        ) : (
          <form className="customer-form" onSubmit={submit} noValidate>
            {register && (
              <FormField
                label="Full name"
                name="fullName"
                autoComplete="name"
                required
                maxLength={150}
                error={errors.fullName}
              />
            )}
            <FormField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              error={errors.email}
            />
            {register && (
              <div className="customer-form-row">
                <FormField
                  label="Phone (optional)"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={30}
                  error={errors.phone}
                />
                <FormField
                  label="Country (optional)"
                  name="country"
                  autoComplete="country-name"
                  maxLength={100}
                />
              </div>
            )}
            <FormField
              label="Password"
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              maxLength={72}
              error={errors.password}
              hint={
                register
                  ? 'At least 8 characters, including a letter and a number.'
                  : undefined
              }
            />
            {register && (
              <FormField
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                maxLength={72}
                error={errors.confirmPassword}
              />
            )}
            {message && (
              <p role="alert" className="form-message">
                {message}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending
                ? 'Please wait…'
                : register
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>
        )}
        <p className="auth-switch">
          {register ? 'Already have an account?' : 'New to Ceyvora?'}{' '}
          <Link to={register ? '/login' : '/register'} state={{ from }}>
            {register ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </div>
  )
}
