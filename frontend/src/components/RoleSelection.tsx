import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { roleOptions } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import type { UserRole } from '../services/authService'

export function RoleSelection() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const mode = pathname === '/join-now' ? 'signup' : 'login'
  const { user, verifyLoginOtp, verifyRegisterOtp } = useAuth()

  // Instant login redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      const targetRoute =
        user.role === 'farmer' ? '/farmer' : user.role === 'retailer' ? '/retailer' : '/buyer'
      navigate(targetRoute, { replace: true })
    }
  }, [user, navigate])

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const rolesTopRef = useRef<HTMLDivElement>(null)

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')

  // 2-Step OTP Authentication Flow
  const [otpStep, setOtpStep] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState('')

  // Status states
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Forgot password states
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetMobile, setResetMobile] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')

  // Only scroll to top when changing page route (/sign-in vs /join-now)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setError('')
    setInfoMessage('')
    setOtpStep(false)
    setEnteredOtp('')
  }, [pathname])

  // Smooth scroll handler when a role is chosen
  const handleSelectRole = (roleId: UserRole) => {
    setSelectedRole(roleId)
    setError('')
    setInfoMessage('')
    setOtpStep(false)
    setEnteredOtp('')

    // Smooth scroll directly to the form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  // Smooth scroll handler when changing role
  const handleChangeRole = () => {
    setSelectedRole(null)
    setOtpStep(false)
    setError('')
    setInfoMessage('')

    setTimeout(() => {
      rolesTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  // Step 1 for Login: Validate Password and Request 2FA OTP
  const handleValidatePasswordAndRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
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
      const res = await authService.validateCredentialsAndSendOtp(phone, password)
      if (res.success) {
        setOtpStep(true)
        setInfoMessage(res.message || `Password verified! 6-digit OTP sent to ${phone}.`)
      } else {
        setError(res.error || 'Invalid credentials or user not registered.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 1 for Signup: Validate Profile and Request Verification OTP
  const handleRequestSignupOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const res = await authService.requestRegisterOtp(phone)
      if (res.success) {
        setOtpStep(true)
        setInfoMessage(`Verification OTP dispatched to ${phone}.`)
      } else {
        setError(res.error || 'Failed to send verification code.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Final OTP Verification & Login / Register
  const handleVerifyOtpAndProceed = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!enteredOtp || enteredOtp.length < 6) {
      setError('Please enter the valid 6-digit OTP.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        const response = await verifyLoginOtp(phone, enteredOtp)
        if (response.success && response.user) {
          const targetRoute =
            response.user.role === 'farmer'
              ? '/farmer'
              : response.user.role === 'retailer'
              ? '/retailer'
              : '/buyer'
          navigate(targetRoute)
        } else {
          setError(response.error || 'Incorrect or expired OTP. Please try again.')
        }
      } else {
        const response = await verifyRegisterOtp(
          {
            name: name.trim(),
            phone: phone,
            password: password,
            role: selectedRole || 'retailer',
            address: address.trim() || undefined,
            pincode: pincode.trim() || undefined,
          },
          enteredOtp
        )
        if (response.success && response.user) {
          const targetRoute =
            response.user.role === 'farmer'
              ? '/farmer'
              : response.user.role === 'retailer'
              ? '/retailer'
              : '/buyer'
          navigate(targetRoute)
        } else {
          setError(response.error || 'Failed to complete registration.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resend OTP Helper
  const handleResendOtp = async () => {
    setError('')
    setInfoMessage('Resending OTP...')
    if (mode === 'login') {
      const res = await authService.validateCredentialsAndSendOtp(phone, password)
      if (res.success) {
        setInfoMessage(`New OTP sent to ${phone}.`)
      }
    } else {
      const res = await authService.requestRegisterOtp(phone)
      if (res.success) {
        setInfoMessage(`New verification code sent to ${phone}.`)
      }
    }
  }

  // Forgot password handlers
  const handleSendResetOtp = async () => {
    if (!resetMobile || resetMobile.length < 10) {
      setResetError('Please enter a valid 10-digit phone number.')
      return
    }
    setResetError('')
    setResetMessage('Sending OTP...')
    const res = await authService.forgotPassword(resetMobile)
    if (res.success) {
      setOtpSent(true)
      setResetMessage(res.message)
    } else {
      setResetError(res.error || 'Failed to send OTP')
    }
  }

  const handleVerifyAndReset = async () => {
    if (!resetOtp || !newPassword) {
      setResetError('Please enter both the OTP and your new password.')
      return
    }
    setResetError('')
    setResetMessage('Updating password...')
    const res = await authService.resetPassword(resetMobile, resetOtp, newPassword)
    if (res.success) {
      setResetMessage(res.message)
      setTimeout(() => {
        setIsResetOpen(false)
        setOtpSent(false)
        setResetMessage('')
      }, 2500)
    } else {
      setResetError(res.error || 'Failed to reset password.')
    }
  }

  return (
    <div className="section-shell py-16 md:py-20">
      <div ref={rolesTopRef} className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 md:p-10">
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Farm Direct Portal</div>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-900 md:text-5xl">
            {mode === 'login' ? 'Sign In with Two-Factor OTP' : 'Choose Your Role'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {selectedRole
              ? `Continue as a ${roleOptions.find((role) => role.id === selectedRole)?.title}.`
              : 'Select your role to access your dedicated workspace.'}
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roleOptions.map((role) => {
            const isSelected = selectedRole === role.id
            return (
              <div
                key={role.id}
                className={`group flex flex-col justify-between rounded-[1.7rem] border bg-gradient-to-br from-white to-emerald-50/50 p-6 text-left transition ${
                  isSelected
                    ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg'
                }`}
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
                    onClick={() => handleSelectRole(role.id as UserRole)}
                    className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                  >
                    {mode === 'login' ? `Sign in as ${role.title}` : `Join as ${role.title}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Auth Form Area */}
        {selectedRole && (
          <div ref={formRef} className="scroll-mt-24 mx-auto mt-12 max-w-lg border-t border-slate-200 pt-10">
            {/* Selected Role Indicator Banner */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white shadow-md shadow-emerald-600/20">
                    {selectedRole === 'farmer' ? '🌾' : selectedRole === 'retailer' ? '🛒' : '🏢'}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      {mode === 'login' ? 'Signing in as' : 'Registering for role:'}
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {roleOptions.find((r) => r.id === selectedRole)?.title || 'Selected Role'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleChangeRole}
                  className="rounded-full border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100/60 transition shadow-sm"
                >
                  Change role
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                  {otpStep ? '2' : '1'}
                </span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {otpStep
                    ? 'Verify 6-Digit OTP'
                    : mode === 'login'
                    ? 'Enter Password'
                    : `Create ${roleOptions.find((r) => r.id === selectedRole)?.title} Account`}
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">
                {otpStep
                  ? `Enter the 6-digit authentication code sent to ${phone}.`
                  : mode === 'login'
                  ? 'Submit your registered password to receive your 6-digit login OTP.'
                  : 'Fill in your details. We will send an OTP to verify your phone number.'}
              </p>
            </div>

            {/* Registered Sample Account Helper (Login Step 1) */}
            {mode === 'login' && !otpStep && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Sample Account:</span>{' '}
                  <span>
                    {selectedRole === 'farmer'
                      ? 'Ravi Kumar (9845012345)'
                      : selectedRole === 'retailer'
                      ? 'Priya Sharma (9876543210)'
                      : 'Metro Agro (9765432100)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const num =
                      selectedRole === 'farmer'
                        ? '9845012345'
                        : selectedRole === 'retailer'
                        ? '9876543210'
                        : '9765432100'
                    setPhone(num)
                    setPassword('password123')
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline ml-2"
                >
                  Auto Fill
                </button>
              </div>
            )}

            {/* STEP 1: CREDENTIALS FORM */}
            {!otpStep ? (
              <form onSubmit={mode === 'login' ? handleValidatePasswordAndRequestOtp : handleRequestSignupOtp} className="mt-5">
                {mode === 'signup' && (
                  <>
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="full-name">
                      Full Name
                      <input
                        id="full-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="address">
                        City / Region
                        <input
                          id="address"
                          type="text"
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          placeholder="e.g. Nashik"
                          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="pincode">
                        Pincode
                        <input
                          id="pincode"
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="e.g. 422001"
                          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                      </label>
                    </div>
                  </>
                )}

                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="phone-number">
                  Registered 10-Digit Mobile Number
                  <input
                    id="phone-number"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 9845012345"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="password">
                  Password
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                {mode === 'login' && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetOpen((isOpen) => !isOpen)
                        setResetMessage('')
                        setResetError('')
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Forgot password?
                    </button>
                    {isResetOpen && (
                      <div className="mt-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-200">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Password Recovery</div>
                        <label className="mt-2 block text-xs font-semibold text-slate-700" htmlFor="reset-mobile">
                          Registered Phone Number
                          <input
                            id="reset-mobile"
                            type="tel"
                            value={resetMobile}
                            onChange={(event) => setResetMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          />
                        </label>

                        {!otpSent ? (
                          <button
                            type="button"
                            onClick={handleSendResetOtp}
                            className="mt-3 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                          >
                            Request Reset OTP
                          </button>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <input
                              id="reset-otp"
                              type="text"
                              maxLength={6}
                              value={resetOtp}
                              onChange={(event) => setResetOtp(event.target.value)}
                              placeholder="Enter 6-Digit OTP"
                              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                            <input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(event) => setNewPassword(event.target.value)}
                              placeholder="New password"
                              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyAndReset}
                              className="w-full rounded-full bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                            >
                              Update Password
                            </button>
                          </div>
                        )}

                        {resetMessage && <p className="mt-2 text-xs font-medium text-emerald-800" role="status">{resetMessage}</p>}
                        {resetError && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{resetError}</p>}
                      </div>
                    )}
                  </div>
                )}

                {error && error.toLowerCase().includes('already registered') ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-4 border border-amber-300 text-amber-900 shadow-sm flex items-center justify-between gap-3 animate-fade-in">
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <span>⚠️ Account Already Exists</span>
                      </div>
                      <p className="mt-0.5 text-xs text-amber-800">
                        {error}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setError('')
                        navigate('/sign-in')
                      }}
                      className="rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition shrink-0 shadow-sm"
                    >
                      Sign in →
                    </button>
                  </div>
                ) : error ? (
                  <p className="mt-4 text-sm font-medium text-red-600" role="alert">
                    ⚠️ {error}
                  </p>
                ) : null}
                {infoMessage && <p className="mt-4 text-sm font-medium text-emerald-800" role="status">ℹ️ {infoMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting ? 'Verifying...' : mode === 'login' ? 'Submit Password & Get OTP →' : 'Continue to OTP Verification →'}
                </button>
              </form>
            ) : (
              /* STEP 2: OTP VERIFICATION FORM */
              <form onSubmit={handleVerifyOtpAndProceed} className="mt-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Step 2: Enter 6-Digit OTP
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-emerald-700 underline"
                    >
                      ← Back / Edit Details
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    We sent a 6-digit verification code to <strong className="text-slate-900">{phone}</strong>. Check your backend server terminal to view the dispatched code.
                  </p>
                  <input
                    id="entered-otp"
                    type="text"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    className="mt-4 w-full rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-center text-2xl font-black tracking-widest text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 shadow-sm"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-bold text-emerald-700 hover:text-emerald-800 underline"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                {error && <p className="mt-4 text-sm font-medium text-red-600" role="alert">⚠️ {error}</p>}
                {infoMessage && <p className="mt-4 text-sm font-medium text-emerald-800" role="status">ℹ️ {infoMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Verifying OTP...'
                    : mode === 'login'
                    ? 'Verify OTP & Enter Workspace'
                    : 'Verify OTP & Complete Registration'}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              {mode === 'login' ? 'New to Fresh Ferme?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setOtpStep(false)
                  navigate(mode === 'login' ? '/join-now' : '/sign-in')
                }}
                className="font-bold text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-800"
              >
                {mode === 'login' ? 'Join now' : 'Sign in'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
