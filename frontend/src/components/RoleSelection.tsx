import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { roleOptions } from '../data/mockData'
import { authService } from '../services/authService'
import type { UserRole } from '../services/authService'

export function RoleSelection() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const mode = pathname === '/join-now' ? 'signup' : 'login'
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetMobile, setResetMobile] = useState('')
  const [resetMessage, setResetMessage] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedRole) return

    setError('')
    setIsSubmitting(true)
    const response = mode === 'login'
      ? await authService.login({ emailOrPhone: phone, password, role: selectedRole })
      : await authService.register({
        name: `User ${phone}`,
        email: `${phone}@freshferme.local`,
        phone: phone,
        password,
        role: selectedRole,
      })

    if (response.success && response.user) {
      navigate(roleOptions.find((role) => role.id === response.user?.role)?.route || '/retailer')
    } else {
      setError(response.error || 'Something went wrong. Please try again.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="section-shell py-16 md:py-20">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 md:p-10">
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Welcome</div>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-900 md:text-5xl">Choose your role</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {selectedRole
              ? `Continue as a ${roleOptions.find((role) => role.id === selectedRole)?.title}.`
              : 'Start with the workspace built for your part of the farm-to-market journey.'}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roleOptions.map((role) => {
            const isSelected = selectedRole === role.id
            return (
              <div
                key={role.id}
                className={`group rounded-[1.7rem] border bg-gradient-to-br from-white to-emerald-50 p-6 text-left transition ${isSelected ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-100' : 'border-slate-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg'}`}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-black text-emerald-700">
                  {role.title.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900">{role.title}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{role.description}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.id as UserRole)
                    setError('')
                  }}
                  className="mt-6 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {mode === 'login' ? 'Sign in' : 'Join now'}
                </button>
              </div>
            )
          })}
        </div>

        {selectedRole && (
          <form onSubmit={handleSubmit} className="mx-auto mt-12 max-w-lg border-t border-slate-200 pt-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  {mode === 'login' ? 'Sign in' : 'Join Fresh Ferme'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-emerald-700"
              >
                Change role
              </button>
            </div>

            <label className="mt-8 block text-sm font-semibold text-slate-700" htmlFor="phone-number">
              Phone number
              <input
                id="phone-number"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter your phone number"
                autoComplete="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="password">
              Password
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {mode === 'login' && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetOpen((isOpen) => !isOpen)
                    setResetMessage('')
                  }}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Forgot password?
                </button>
                {isResetOpen && (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="reset-mobile">
                      Phone number
                      <input
                        id="reset-mobile"
                        type="tel"
                        value={resetMobile}
                        onChange={(event) => setResetMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter your phone number"
                        autoComplete="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        required
                        className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setResetMessage('Reset instructions will be sent to your phone number.')}
                      className="mt-3 rounded-full border border-emerald-600 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    >
                      Send reset instructions
                    </button>
                    {resetMessage && <p className="mt-3 text-sm font-medium text-emerald-800" role="status">{resetMessage}</p>}
                  </div>
                )}
              </div>
            )}

            {error && <p className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 w-full rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            <p className="mt-5 text-center text-sm text-slate-600">
              {mode === 'login' ? 'New to Fresh Ferme?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => navigate(mode === 'login' ? '/join-now' : '/sign-in')}
                className="font-bold text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-800"
              >
                {mode === 'login' ? 'Join now' : 'Sign in'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
