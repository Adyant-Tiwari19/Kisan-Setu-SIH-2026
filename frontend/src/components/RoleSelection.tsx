import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { roleOptions } from '../data/mockData'
import { authService, type UserRole } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export function RoleSelection() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { verifyLoginOtp, verifyRegisterOtp } = useAuth()
  const mode = pathname === '/join-now' ? 'signup' : 'login'

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetMobile, setResetMobile] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const formSectionRef = useRef<HTMLDivElement>(null)
  const roleSelectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  useEffect(() => {
    if (mode !== 'signup' || !selectedRole) return

    const frame = window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mode, selectedRole])

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setError('')
    setInfoMessage('')
    setOtpStep(false)
    setEnteredOtp('')
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit registered phone number.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      authService.clearSession()
      const res = await authService.validateCredentialsAndSendOtp(phone, password)
      if (res.success) {
        setOtpStep(true)
        setInfoMessage(res.message)
      } else {
        setError(res.error || 'Credentials verification failed.')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedRole) return
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }
    if (!password || password.length < 4) {
      setError('Please create a password (at least 4 characters).')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const res = await authService.requestRegisterOtp(phone)
      if (res.success) {
        setOtpStep(true)
        setInfoMessage(res.message)
      } else {
        setError(res.error || 'Failed to send verification OTP.')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtpAndProceed = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!enteredOtp || enteredOtp.length < 6) {
      setError('Please enter the valid 6-digit OTP.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      let response
      if (mode === 'login') {
        response = await verifyLoginOtp(phone, enteredOtp)
      } else {
        const roleToUse: UserRole = selectedRole || 'retailer'
        response = await verifyRegisterOtp(
          {
            name: name.trim(),
            phone,
            password,
            role: roleToUse,
            address: address.trim(),
            pincode: pincode.trim(),
          },
          enteredOtp
        )
      }

      if (response.success && response.user) {
        const targetRoute =
          response.user.role === 'farmer'
            ? '/farmer'
            : response.user.role === 'retailer'
              ? '/retailer'
              : '/buyer'
        navigate(targetRoute)
      } else {
        setError(response.error || 'Failed to verify OTP.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP code or verification failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (!phone || phone.length < 10) return
    setError('')
    setInfoMessage('Resending OTP...')
    try {
      if (mode === 'login') {
        const res = await authService.validateCredentialsAndSendOtp(phone, password)
        if (res.success) {
          setInfoMessage(res.message)
        } else {
          setError(res.error || 'Failed to resend OTP.')
        }
      } else {
        const res = await authService.requestRegisterOtp(phone)
        if (res.success) {
          setInfoMessage(res.message)
        } else {
          setError(res.error || 'Failed to resend OTP.')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.')
    }
  }

  const handleSendResetOtp = async () => {
    if (!resetMobile || resetMobile.length < 10) {
      setResetMessage('')
      setError('Please enter a valid 10-digit phone number.')
      return
    }
    setError('')
    setResetMessage('Sending OTP...')
    const res = await authService.forgotPassword(resetMobile)
    if (res.success) {
      setResetMessage(res.message)
    } else {
      setResetMessage(res.error || 'Failed to send OTP')
    }
  }

  return (
    <div className="section-shell py-16 md:py-20">
      <div ref={roleSelectionRef} className="scroll-mt-24 mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 md:p-10">
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Farm Direct Portal</div>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-900 md:text-5xl">
            {mode === 'login' ? 'Sign In with Two-Factor OTP' : 'Choose Your Role'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {mode === 'login'
              ? 'Enter your registered mobile number and password. We will identify your role automatically.'
              : selectedRole
              ? `Continue as a ${roleOptions.find((role) => role.id === selectedRole)?.title}.`
              : 'Select your role to access your dedicated workspace.'}
          </p>
        </div>

        {mode === 'signup' && <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roleOptions.map((role) => (
              <div
                key={role.id}
                className="group flex flex-col justify-between rounded-[1.7rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/50 p-6 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-black text-emerald-700">
                    {role.title.charAt(0)}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{role.title}</h2>
                  <p className="mt-3 text-base leading-7 text-slate-600">{role.description}</p>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect(role.id as UserRole)}
                    className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                  >
                    Join as {role.title}
                  </button>
                </div>
              </div>
          ))}
        </div>}

        {(selectedRole || mode === 'login') && (
          <div ref={formSectionRef} className="scroll-mt-24 mx-auto mt-12 max-w-lg border-t border-slate-200 pt-10">
            {mode === 'signup' && <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white shadow-md shadow-emerald-600/20">
                    {selectedRole === 'farmer' ? '🌾' : selectedRole === 'retailer' ? '🛒' : '🏢'}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Registering for role:
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {roleOptions.find((r) => r.id === selectedRole)?.title || 'Selected Role'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null)
                    window.requestAnimationFrame(() => {
                      roleSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    })
                  }}
                  className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-emerald-700"
                >
                  Change role
                </button>
              </div>
            </div>}

            {!otpStep ? (
              <form
                onSubmit={mode === 'login' ? handleLoginSubmit : handleSignupSubmit}
                className="mt-8 space-y-5"
              >
                {mode === 'signup' && (
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="name-field">
                    Full name
                    <input
                      id="name-field"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                )}

                <label className="block text-sm font-semibold text-slate-700" htmlFor="phone-field">
                  Phone number
                  <input
                    id="phone-field"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                {mode === 'signup' && (
                  <>
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="address-field">
                      Address
                      <input
                        id="address-field"
                        type="text"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="Street / locality"
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>

                    <label className="block text-sm font-semibold text-slate-700" htmlFor="pincode-field">
                      Pincode
                      <input
                        id="pincode-field"
                        type="text"
                        value={pincode}
                        onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="e.g. 560038"
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>
                  </>
                )}

                <label className="block text-sm font-semibold text-slate-700" htmlFor="password-field">
                  Password
                  <input
                    id="password-field"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                {mode === 'login' && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setIsResetOpen((open) => !open)}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Forgot password?
                    </button>
                    {isResetOpen && (
                      <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                        <label className="block text-sm font-semibold text-slate-700" htmlFor="reset-mobile-field">
                          Phone number
                          <input
                            id="reset-mobile-field"
                            type="tel"
                            value={resetMobile}
                            onChange={(event) => setResetMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="Enter your phone number"
                            className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleSendResetOtp}
                          className="mt-3 rounded-full border border-emerald-600 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                        >
                          Send reset instructions
                        </button>
                        {resetMessage && <p className="mt-3 text-sm font-medium text-emerald-800" role="status">{resetMessage}</p>}
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>

                <p className="text-center text-sm text-slate-600">
                  {mode === 'login' ? 'New to Kisan Setu?' : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => navigate(mode === 'login' ? '/join-now' : '/sign-in')}
                    className="font-bold text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-800"
                  >
                    {mode === 'login' ? 'Join now' : 'Sign in'}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndProceed} className="mt-8 space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                  {infoMessage || 'We sent a 6-digit one-time code to your phone.'}
                </div>

                <label className="block text-sm font-semibold text-slate-700" htmlFor="otp-field">
                  Enter OTP
                  <input
                    id="otp-field"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(event) => setEnteredOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify & continue'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Resend
                  </button>
                </div>

              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
