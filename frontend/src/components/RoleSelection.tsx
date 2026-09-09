import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { roleOptions } from '../data/mockData'
import { authService, type UserRole } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

const joinRoleContent: Record<UserRole, { summary: string; benefits: string[] }> = {
  farmer: { summary: 'auth.farmerSummary', benefits: ['auth.farmerBenefitDemand', 'auth.farmerBenefitPickup', 'auth.farmerBenefitOrders'] },
  retailer: { summary: 'auth.customerSummary', benefits: ['auth.customerBenefitSource', 'auth.customerBenefitCompare', 'auth.customerBenefitOrders'] },
  'bulk-buyer': { summary: 'auth.bulkBuyerSummary', benefits: ['auth.bulkBuyerBenefitRequests', 'auth.bulkBuyerBenefitSuppliers', 'auth.bulkBuyerBenefitSupply'] },
}

function RoleIllustration({ role }: { role: UserRole }) {
  const illustrations: Record<UserRole, { src: string; alt: string }> = {
    farmer: { src: '/farmer-portrait.png', alt: 'Farmer harvesting fresh vegetables' },
    retailer: { src: '/retailer-portrait.png', alt: 'Customer arranging fresh produce' },
    'bulk-buyer': { src: '/role-bulk-buyer.jpg', alt: 'Bulk buyer coordinating produce delivery' },
  }
  const illustration = illustrations[role]
  return <img src={illustration.src} alt={illustration.alt} />
}

export function RoleSelection() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { verifyLoginOtp, verifyRegisterOtp } = useAuth()
  const { t } = useTranslation()
  const mode = pathname === '/join-now' ? 'signup' : 'login'

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [accountNum, setAccountNum] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetMobile, setResetMobile] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [isResetOtpStep, setIsResetOtpStep] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const formSectionRef = useRef<HTMLDivElement>(null)
  const roleSelectionRef = useRef<HTMLDivElement>(null)
  const otpFormRef = useRef<HTMLFormElement>(null)
  const otpInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!otpStep) return

    const frame = window.requestAnimationFrame(() => {
      otpInputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [otpStep])

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
      setError(t('auth.invalidLoginPhone'))
      return
    }
    if (!password) {
      setError(t('auth.enterPassword'))
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
        setError(res.error || t('auth.credentialsFailed'))
      }
    } catch (err: any) {
      setError(err?.message || t('auth.sendOtpFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedRole) return
    if (!name.trim()) {
      setError(t('auth.enterFullName'))
      return
    }
    if (!phone || phone.length < 10) {
      setError(t('auth.invalidPhone'))
      return
    }
    if (!password || password.length < 4) {
      setError(t('auth.createValidPassword'))
      return
    }
    if (selectedRole === 'farmer' && (!accountNum.trim() || !ifsc.trim())) {
      setError(t('auth.accountDetailsRequired'))
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
        setError(res.error || t('auth.verificationOtpFailed'))
      }
    } catch (err: any) {
      setError(err?.message || t('auth.sendOtpFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtpAndProceed = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!enteredOtp || enteredOtp.length < 6) {
      setError(t('auth.enterValidOtp'))
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
            account_num: accountNum.trim(),
            ifsc: ifsc.trim().toUpperCase(),
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
        setError(response.error || t('auth.verifyOtpFailed'))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.invalidOtp'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (!phone || phone.length < 10) return
    setError('')
    setInfoMessage(t('auth.resendingOtp'))
    try {
      if (mode === 'login') {
        const res = await authService.validateCredentialsAndSendOtp(phone, password)
        if (res.success) {
          setInfoMessage(res.message)
        } else {
          setError(res.error || t('auth.resendOtpFailed'))
        }
      } else {
        const res = await authService.requestRegisterOtp(phone)
        if (res.success) {
          setInfoMessage(res.message)
        } else {
          setError(res.error || t('auth.resendOtpFailed'))
        }
      }
    } catch (err: any) {
      setError(err?.message || t('auth.resendOtpFailed'))
    }
  }

  const handleSendResetOtp = async () => {
    if (!resetMobile || resetMobile.length < 10) {
      setResetMessage('')
      setError(t('auth.invalidPhone'))
      return
    }
    setError('')
    setResetMessage(t('auth.sendingOtp'))
    const res = await authService.forgotPassword(resetMobile)
    if (res.success) {
      setResetMessage(res.message)
      setIsResetOtpStep(true)
    } else {
      setResetMessage(res.error || t('auth.resetOtpFailed'))
    }
  }

  const handleResetPassword = async () => {
    if (resetOtp.length !== 6) {
      setResetMessage(t('auth.enterSixDigitOtp'))
      return
    }
    if (resetNewPassword.length < 4) {
      setResetMessage(t('auth.newPasswordLength'))
      return
    }

    setResetMessage(t('auth.updatingPassword'))
    const res = await authService.resetPassword(resetMobile, resetOtp, resetNewPassword)
    if (res.success) {
      setResetMessage(res.message)
      setIsResetOtpStep(false)
      setResetOtp('')
      setResetNewPassword('')
    } else {
      setResetMessage(res.error || t('auth.resetPasswordFailed'))
    }
  }

  const selectedRoleData = roleOptions.find((role) => role.id === selectedRole)
  const roleCopy: Record<string, { title: string; description: string }> = {
    farmer: { title: t('auth.roleFarmerTitle'), description: t('auth.roleFarmerDescription') },
    retailer: { title: t('auth.roleCustomerTitle'), description: t('auth.roleCustomerDescription') },
    'bulk-buyer': { title: t('auth.roleBulkBuyerTitle'), description: t('auth.roleBulkBuyerDescription') },
  }
  const handleOtpChange = (value: string) => {
    const nextOtp = value.replace(/\D/g, '').slice(0, 6)
    setEnteredOtp(nextOtp)
    if (nextOtp.length === 6) {
      window.requestAnimationFrame(() => otpFormRef.current?.requestSubmit())
    }
  }

  return (
    <main className={`auth-page auth-page-${mode}`}>
      <button type="button" className="auth-back-home" onClick={() => navigate('/')}>
        {t('auth.backToHome')}
      </button>
      <div ref={roleSelectionRef} className="auth-shell">
        {mode === 'login' ? (
          <aside className="auth-welcome">
            <div className="auth-field-lines" aria-hidden="true" />
            <div className="auth-welcome-copy">
              <span className="auth-eyebrow">{t('auth.welcomeBack')}</span>
              <h1>{t('auth.authHeroTitleLine1')}<br /><span>{t('auth.authHeroTitleLine2')}</span></h1>
              <p>{t('auth.authHeroDesc')}</p>
            </div>
            <div className="auth-route-line" aria-hidden="true"><span /></div>
            <div className="auth-footnote">{t('auth.secureAccess')} <b>·</b> {t('auth.verifiedTradeNetwork')}</div>
          </aside>
        ) : (
          <header className="join-intro">
            <span className="auth-eyebrow">{t('auth.joinKisanSetu')}</span>
            <h1>{t('auth.chooseRole')}</h1>
            <p>{t('auth.chooseRoleDescription')}</p>
          </header>
        )}

        <section ref={formSectionRef} className="auth-form-area">
          <div className="auth-progress" aria-label={otpStep ? t('auth.stepVerifyOtp') : mode === 'login' ? t('auth.stepSignIn') : t('auth.stepCreateAccount')}>
            <span className={!otpStep ? 'is-current' : 'is-complete'}>{mode === 'login' ? t('auth.stepSignIn') : t('auth.stepCreateAccount')}</span>
            <i />
            <span className={otpStep ? 'is-current' : ''}>{t('auth.stepVerifyOtp')}</span>
          </div>

          {mode === 'signup' && !selectedRole && <div ref={roleSelectionRef} className="join-role-grid" aria-label={t('auth.chooseRole')}>
            {roleOptions.map((role) => {
              const content = joinRoleContent[role.id as UserRole]
              return <article key={role.id} className={`join-role-card${selectedRole === role.id ? ' is-selected' : ''}`} tabIndex={0} onClick={() => handleRoleSelect(role.id as UserRole)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleRoleSelect(role.id as UserRole) }}>
                <div className="join-role-visual"><RoleIllustration role={role.id as UserRole} /></div>
                <div className="join-role-body"><h2>{t(`auth.role${role.id === 'farmer' ? 'Farmer' : role.id === 'retailer' ? 'Customer' : 'BulkBuyer'}`)}</h2><p className="join-role-summary">{t(content.summary)}</p><span className="join-benefits-label">{t('auth.whatYouCanDo')}</span><ul>{content.benefits.map((benefit) => <li key={benefit}>{t(benefit)}</li>)}</ul></div>
                <button type="button" className="join-role-cta" onClick={(event) => { event.stopPropagation(); handleRoleSelect(role.id as UserRole) }}>{t('auth.continueAs', { role: t(`auth.role${role.id === 'farmer' ? 'Farmer' : role.id === 'retailer' ? 'Customer' : 'BulkBuyer'}`) })}</button>
              </article>
            })}
          </div>}
          {mode === 'signup' && !selectedRole && <p className="join-account-link">{t('auth.alreadyHaveAccount')} <button type="button" onClick={() => navigate('/sign-in')}>{t('auth.signIn')}</button></p>}

          {(selectedRole || mode === 'login') && (
            <div className="auth-form-wrap">
              {mode === 'signup' && !otpStep && <div className="selected-role-line"><span>{t('auth.registeringAs')}</span><strong>{selectedRoleData && t(`auth.role${selectedRoleData.id === 'farmer' ? 'Farmer' : selectedRoleData.id === 'retailer' ? 'Customer' : 'BulkBuyer'}`)}</strong><button type="button" onClick={() => { setSelectedRole(null); window.requestAnimationFrame(() => roleSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }}>{t('auth.changeRole')}</button></div>}

              {!otpStep ? (
                <form onSubmit={mode === 'login' ? handleLoginSubmit : handleSignupSubmit} className="auth-form">
                  <div className="form-heading"><h2>{mode === 'login' ? t('auth.signInHeading') : t('auth.continueAs', { role: roleCopy[selectedRole || 'retailer']?.title })}</h2><p>{mode === 'login' ? t('auth.enterMobileSub') : roleCopy[selectedRole || 'retailer']?.description}</p></div>
                  {mode === 'signup' && <label htmlFor="name-field">{t('auth.fullName')}<input id="name-field" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder={t('auth.fullNamePlaceholder')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label>}
                  <label htmlFor="phone-field">{t('auth.mobileLabel')}<div className="phone-field"><span>+91</span><input id="phone-field" type="tel" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder={t('auth.mobilePlaceholder')} autoComplete="tel" inputMode="numeric" maxLength={10} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></div></label>
                  {mode === 'signup' && <><label htmlFor="address-field">{t('auth.address')}<input id="address-field" type="text" value={address} onChange={(event) => setAddress(event.target.value)} placeholder={t('auth.addressPlaceholder')} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label><label htmlFor="pincode-field">{t('auth.pincode')}<input id="pincode-field" type="text" value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('auth.pincodePlaceholder')} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label>{selectedRole === 'farmer' && <><label htmlFor="account-number-field">{t('auth.accountNumber')}<input id="account-number-field" type="text" value={accountNum} onChange={(event) => setAccountNum(event.target.value.replace(/\D/g, ''))} placeholder={t('auth.accountNumberPlaceholder')} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label><label htmlFor="ifsc-field">{t('auth.ifscCode')}<input id="ifsc-field" type="text" value={ifsc} onChange={(event) => setIfsc(event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} placeholder={t('auth.ifscPlaceholder')} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label></>}</>}
                  <label htmlFor="password-field">{t('auth.password')}<input id="password-field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t(mode === 'login' ? 'auth.passwordPlaceholder' : 'auth.createPasswordPlaceholder')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label>
                  {mode === 'login' && <div className="reset-area"><button type="button" onClick={() => setIsResetOpen((open) => !open)}>{t('auth.forgotPassword')}</button>{isResetOpen && <div className="reset-panel">
                    {!isResetOtpStep ? (
                      <>
                        <label htmlFor="reset-mobile-field">{t('auth.mobileLabel')}<input id="reset-mobile-field" type="tel" value={resetMobile} onChange={(event) => setResetMobile(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder={t('auth.mobilePlaceholder')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label>
                        <button type="button" onClick={handleSendResetOtp}>{t('auth.sendResetInstructions')}</button>
                      </>
                    ) : (
                      <>
                        <label htmlFor="reset-otp-field">{t('auth.enterOtp')}<input id="reset-otp-field" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={resetOtp} onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('auth.otpPlaceholder')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label>
                        <label htmlFor="reset-password-field">{t('auth.newPassword')}<input id="reset-password-field" type="password" value={resetNewPassword} onChange={(event) => setResetNewPassword(event.target.value)} placeholder={t('auth.newPasswordPlaceholder')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" /></label>
                        <button type="button" onClick={handleResetPassword}>{t('auth.updatePassword')}</button>
                      </>
                    )}
                    {resetMessage && <p role="status">{resetMessage}</p>}
                  </div>}</div>}
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button type="submit" disabled={isSubmitting} className="auth-submit">{isSubmitting ? t('auth.pleaseWait') : mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}</button>
                  <p className="auth-switch">{mode === 'login' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')} <button type="button" onClick={() => navigate(mode === 'login' ? '/join-now' : '/sign-in')}>{mode === 'login' ? t('auth.registerNow') : t('auth.signIn')}</button></p>
                </form>
              ) : (
                <form ref={otpFormRef} onSubmit={handleVerifyOtpAndProceed} className="auth-form otp-form">
                  <div className="form-heading"><h2>{t('auth.verifyHeading')}</h2><p>{infoMessage || t('auth.verifyDescription')}</p></div>
                  <label htmlFor="otp-input">{t('auth.enterOtp')}
                    <div className="otp-cells">
                      {Array.from({ length: 6 }, (_, index) => (
                        <span key={index} className={`otp-cell${enteredOtp.length === index ? ' is-active' : ''}`} aria-hidden="true">
                          {enteredOtp[index] || ''}
                        </span>
                      ))}
                      <input
                        id="otp-input"
                        ref={otpInputRef}
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(event) => handleOtpChange(event.target.value)}
                        aria-label={t('auth.sixDigitOtp')}
                      />
                    </div>
                  </label>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <div className="otp-actions"><button type="submit" disabled={isSubmitting} className="auth-submit">{isSubmitting ? t('auth.verifying') : t('auth.verifyContinue')}</button><button type="button" className="resend-button" onClick={handleResendOtp}>{t('auth.resend')}</button></div>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
      <style>{`
        .auth-page { min-height: calc(100vh - 5rem); padding: 4.5rem max(24px, calc((100% - 1200px) / 2)) 6rem; background: var(--ff-cream); }
        .auth-shell { position: relative; display: grid; grid-template-columns: 40% 60%; max-width: 1160px; min-height: 640px; margin: 0 auto; overflow: hidden; border-radius: 2rem; background: #F0EBE4; box-shadow: 0 28px 80px rgba(13,27,42,.12); animation: auth-enter .6s ease both; }
        .auth-welcome { position: relative; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; padding: 3.5rem 3rem 2.5rem; color: #fff; background: var(--ff-deep); }
        .auth-welcome::after { position: absolute; content: ''; inset: 0; opacity: .16; background-image: radial-gradient(rgba(255,255,255,.7) .6px, transparent .7px); background-size: 5px 5px; pointer-events: none; }
        .auth-field-lines { position: absolute; inset: -10% -20%; opacity: .2; background: repeating-linear-gradient(158deg, transparent 0 34px, rgba(210,240,187,.8) 35px, transparent 36px 72px); transform: rotate(-8deg); }
        .auth-welcome-copy, .auth-route-line, .auth-footnote { position: relative; z-index: 1; }
        .auth-eyebrow { color: var(--ff-yellow); font-size: .7rem; font-weight: 800; letter-spacing: .2em; }
        .auth-welcome h1, .join-intro h1 { margin: 1.3rem 0 1.5rem; color: inherit; font-size: clamp(3.2rem, 5vw, 5rem); font-weight: 900; letter-spacing: -.065em; line-height: .94; }
        .auth-welcome h1 span, .join-intro h1 span { color: var(--ff-mint); }
        .auth-dot { color: var(--ff-yellow) !important; }
        .auth-welcome p { max-width: 17rem; color: rgba(255,255,255,.72); font-size: 1rem; line-height: 1.7; }
        .auth-route-line { width: 80%; height: 2px; margin: auto 0 2rem; background: repeating-linear-gradient(90deg, #b8dc9d 0 5px, transparent 5px 13px); transform: rotate(-8deg); }
        .auth-route-line span { position: absolute; top: 50%; left: 0; width: .6rem; height: .6rem; border-radius: 50%; background: var(--ff-yellow); box-shadow: 0 0 0 .35rem rgba(242,162,0,.15); animation: auth-route 4s ease-in-out infinite; }
        .auth-footnote { color: rgba(255,255,255,.5); font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; }.auth-footnote b { color: var(--ff-yellow); padding: 0 .35rem; }
        .auth-form-area { padding: 3.5rem clamp(2rem, 6vw, 5.5rem); background: #F0EBE4; }
        .auth-progress { display: flex; align-items: center; gap: .8rem; color: #a3aaa3; font-size: .68rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }.auth-progress i { display: block; width: 3rem; height: 1px; background: #d8ded5; }.auth-progress span.is-current { color: var(--ff-deep); }.auth-progress span.is-complete { color: var(--ff-fresh); }
        .auth-form-wrap { max-width: 30rem; margin: 4rem auto 0; }.form-heading h2 { margin: 0 0 .65rem; color: var(--ff-navy); font-size: clamp(1.7rem, 3vw, 2.35rem); font-weight: 900; letter-spacing: -.05em; line-height: 1.05; }.form-heading p { margin: 0 0 2rem; color: var(--ff-muted); font-size: .94rem; line-height: 1.65; }
        .auth-form { display: grid; gap: 1.15rem; }.auth-form label, .reset-panel label { display: grid; gap: .45rem; color: var(--ff-slate); font-size: .76rem; font-weight: 800; letter-spacing: .05em; }.auth-form input, .reset-panel input { width: 100%; border: 1px solid #e2e8f0; border-radius: .75rem; background: #fff; padding: .625rem 1rem; color: #0f172a; font: inherit; font-size: .875rem; font-weight: 500; outline: none; box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: border-color .2s, box-shadow .2s; }.auth-form input:focus, .reset-panel input:focus { border-color: transparent; box-shadow: 0 0 0 2px #059669; }.auth-form input::placeholder { color: #64748b; }.phone-field { display: flex; align-items: center; gap: .75rem; border: 0; }.phone-field:focus-within { border: 0; box-shadow: none; }.phone-field span { color: var(--ff-deep); font-weight: 800; }.phone-field input { border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(15,23,42,.04) !important; }
        .reset-area > button, .auth-switch button, .selected-role-line button { border: 0; background: none; padding: 0; color: var(--ff-fresh); font: inherit; font-size: .78rem; font-weight: 800; cursor: pointer; }.reset-panel { display: grid; gap: .8rem; margin-top: 1rem; padding: 1rem; background: #eef6e9; }.reset-panel > button, .resend-button { width: fit-content; border: 1px solid var(--ff-fresh); border-radius: 999px; background: transparent; padding: .55rem .9rem; color: var(--ff-fresh); font: inherit; font-size: .75rem; font-weight: 800; cursor: pointer; }.reset-panel p { margin: 0; color: var(--ff-fresh); font-size: .78rem; }.form-error { margin: 0; color: #b42318; font-size: .8rem; }.auth-submit { width: 100%; border: 0; border-radius: 999px; background: var(--ff-deep); padding: .9rem 1.5rem; color: #F0EBE4; font: inherit; font-weight: 800; box-shadow: 0 8px 20px rgba(43,86,77,.2); transition: transform .2s, background .2s, box-shadow .2s; cursor: pointer; }.auth-submit:hover { background: #23483F; transform: translateY(-2px); box-shadow: 0 12px 26px rgba(43,86,77,.28); }.auth-submit:disabled { opacity: .6; cursor: wait; transform: none; }.auth-switch { margin: .5rem 0 0; color: var(--ff-muted); font-size: .82rem; text-align: center; }.auth-switch button { text-decoration: underline; text-underline-offset: .2rem; }.otp-form { margin-top: 0; }.otp-cells { position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .6rem; min-width: 0; margin-top: .4rem; }.otp-cell { display: flex; align-items: center; justify-content: center; width: 100%; min-width: 0; min-height: 3.2rem; box-sizing: border-box; border: 1px solid #cfd8ce; border-radius: .7rem; background: #F0EBE4; padding: .75rem 0; text-align: center; font-size: 1.3rem; font-weight: 800; }.otp-cell.is-active { border-color: var(--ff-fresh); box-shadow: 0 0 0 3px rgba(82,183,136,.18); }.otp-input { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; opacity: 0; cursor: text; }.otp-input:focus { outline: none; }.otp-actions { display: flex; align-items: center; gap: .75rem; }.otp-actions .auth-submit { flex: 1; }.resend-button { padding: .9rem 1rem; }
        .join-intro { grid-column: 1 / -1; max-width: 48rem; padding: 4rem 5rem 1rem; }.join-intro h1 { color: var(--ff-navy); margin-bottom: 1rem; }.join-intro p { max-width: 35rem; margin: 0; color: var(--ff-muted); font-size: 1rem; line-height: 1.7; }.auth-page-signup .auth-shell { display: block; min-height: auto; padding-bottom: 4rem; }.auth-page-signup .auth-form-area { padding: 1.5rem 5rem 0; }.role-lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); min-height: 18rem; margin: 2rem 0 1.5rem; overflow: hidden; border: 1px solid #ccd8c9; border-radius: 1.4rem; background: #d8e3d2; gap: 1px; }.role-lane { position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 0; background: #f5f5e9; padding: 1.6rem 1.4rem; color: var(--ff-deep); text-align: left; cursor: pointer; transition: background .25s ease, color .25s ease, box-shadow .25s ease; }.role-lane:hover, .role-lane:focus-visible { z-index: 1; background: #e7f0df; outline: none; box-shadow: inset 0 0 0 2px var(--ff-mint); }.role-lane-farmer { background: #edf2e1; }.role-lane-retailer { background: #f6efe0; }.role-lane-bulk-buyer { background: #e9edf0; }.lane-texture { position: absolute; inset: 0; opacity: .25; background: repeating-linear-gradient(158deg, transparent 0 28px, rgba(92,133,78,.7) 29px, transparent 30px 60px); }.role-lane-retailer .lane-texture { background: linear-gradient(90deg, transparent 0 25%, rgba(179,133,69,.5) 26% 27%, transparent 28% 50%, rgba(179,133,69,.4) 51% 52%, transparent 53%), repeating-linear-gradient(0deg, transparent 0 32px, rgba(150,117,63,.3) 33px, transparent 34px 66px); }.role-lane-bulk-buyer .lane-texture { background: repeating-linear-gradient(90deg, transparent 0 32px, rgba(62,83,98,.35) 33px, transparent 34px 68px), repeating-linear-gradient(0deg, transparent 0 32px, rgba(62,83,98,.25) 33px, transparent 34px 68px); }.lane-number, .lane-content { position: relative; z-index: 1; }.lane-number { color: var(--ff-fresh); font-size: .7rem; font-weight: 800; letter-spacing: .15em; }.lane-content { align-self: stretch; display: grid; align-content: end; gap: .45rem; margin-top: 2rem; }.lane-content strong { font-size: clamp(1.35rem, 2.5vw, 2rem); font-weight: 900; letter-spacing: -.05em; }.lane-content em { font-style: normal; font-weight: 800; line-height: 1.35; }.lane-content small { max-width: 18rem; color: #5c6c62; font-size: .78rem; line-height: 1.5; }.lane-select { margin-top: .45rem; color: var(--ff-fresh); font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }.lane-hint { margin: 0 0 1rem; color: var(--ff-muted); font-size: .82rem; text-align: center; }.selected-role-line { display: flex; align-items: center; gap: .75rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #dce4da; }.selected-role-line span { color: #849187; font-size: .65rem; font-weight: 800; letter-spacing: .15em; }.selected-role-line strong { color: var(--ff-deep); }.selected-role-line button { margin-left: auto; text-decoration: underline; text-underline-offset: .2rem; }
        .role-lanes { position: relative; isolation: isolate; border-color: #d4ddd0; background: #F0EBE4; box-shadow: 0 16px 35px rgba(43,86,77,.08); }
        .role-lanes::before { position: absolute; content: ''; z-index: -1; inset: 0; opacity: .45; background: repeating-linear-gradient(164deg, transparent 0 32px, rgba(82,132,79,.14) 33px, transparent 34px 68px); }
        .role-lane, .role-lane-farmer, .role-lane-retailer, .role-lane-bulk-buyer { background: transparent !important; color: var(--ff-deep); }
        .role-lane { border-right: 1px solid #d4ddd0; padding: 1.75rem 1.6rem; transition: background .25s ease, box-shadow .25s ease, transform .25s ease; }
        .role-lane:last-child { border-right: 0; }
        .role-lane:hover, .role-lane:focus-visible { background: rgba(216,243,220,.72) !important; box-shadow: inset 0 3px 0 var(--ff-fresh); transform: translateY(-2px); }
        .lane-texture { opacity: .18; background: repeating-linear-gradient(164deg, transparent 0 32px, rgba(82,132,79,.55) 33px, transparent 34px 68px) !important; }
        .lane-number { color: #809780; font-size: .72rem; letter-spacing: .16em; }
        .lane-content { margin-top: 3rem; }
        .lane-content strong { color: var(--ff-navy); font-size: clamp(1.45rem, 2.6vw, 2.15rem); }
        .lane-content em { color: var(--ff-deep); font-size: .95rem; }
        .lane-content small { color: #68786c; }
        .lane-select { display: inline-flex; width: fit-content; margin-top: .7rem; border-bottom: 1px solid #8db197; padding-bottom: .18rem; color: var(--ff-fresh); font-size: .66rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .auth-page-signup .auth-form-area { padding-top: 1.5rem; }
        .join-role-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; margin: 2.75rem auto 1.5rem; max-width: 1080px; }
        .join-role-card { position: relative; display: flex; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid #dce3dc; border-radius: 1.35rem; background: #F0EBE4; box-shadow: 0 12px 30px rgba(13,27,42,.07); color: var(--ff-navy); cursor: pointer; outline: none; transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .join-role-card:hover, .join-role-card:focus-visible { border-color: var(--ff-fresh); box-shadow: 0 18px 38px rgba(43,86,77,.16); transform: translateY(-5px); }
        .join-role-visual { display: grid; min-height: 11.5rem; place-items: center; overflow: hidden; background: #e6f0dc; padding: 0; transition: background .25s ease; }
        .join-role-card:nth-child(2) .join-role-visual { background: #f5e8ca; }.join-role-card:nth-child(3) .join-role-visual { background: #e1e8e9; }
        .join-role-visual img { width: 100%; height: 100%; max-height: 11rem; object-fit: cover; object-position: center; filter: saturate(.94) sepia(.04) hue-rotate(-4deg); transition: transform .3s ease, filter .3s ease, box-shadow .3s ease; }.join-role-card:hover .join-role-visual img, .join-role-card:focus-visible .join-role-visual img { filter: brightness(1.04) saturate(1) sepia(.04) hue-rotate(-4deg); transform: scale(1.02); }
        .join-role-body { flex: 1; padding: 1.4rem 1.45rem .8rem; }.join-role-body h2 { margin: 0 0 .5rem; color: var(--ff-navy); font-size: 1.7rem; font-weight: 900; letter-spacing: -.05em; }.join-role-summary { min-height: 2.7rem; margin: 0 0 1.35rem; color: #627066; font-size: .84rem; line-height: 1.55; }.join-benefits-label { display: block; margin-bottom: .55rem; color: #819084; font-size: .63rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }.join-role-body ul { display: grid; gap: .48rem; margin: 0; padding: 0; list-style: none; }.join-role-body li { position: relative; padding-left: 1rem; color: #47594d; font-size: .78rem; line-height: 1.35; }.join-role-body li::before { position: absolute; content: ''; top: .48rem; left: 0; width: .32rem; height: .32rem; border-radius: 50%; background: var(--ff-mint); }.join-role-cta { margin: .8rem 1.45rem 1.45rem; border: 1px solid var(--ff-deep); border-radius: 999px; background: transparent; padding: .75rem 1rem; color: var(--ff-deep); font: inherit; font-size: .78rem; font-weight: 800; cursor: pointer; transition: background .2s ease, color .2s ease, transform .2s ease; }.join-role-card:hover .join-role-cta, .join-role-card:focus-visible .join-role-cta { background: var(--ff-deep); color: #fff; }.join-account-link { margin: 1.5rem 0 0; color: var(--ff-muted); font-size: .82rem; text-align: center; }.join-account-link button { border: 0; background: none; padding: 0; color: var(--ff-fresh); font: inherit; font-weight: 800; text-decoration: underline; text-underline-offset: .2rem; cursor: pointer; }
        @keyframes auth-enter { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } } @keyframes auth-route { 0%, 100% { left: 0; } 50% { left: 95%; } }
        .auth-back-home { position: absolute; top: 1rem; left: max(1rem, calc((100% - 1160px) / 2)); z-index: 2; border: 1px solid rgba(43,86,77,.18); border-radius: 999px; background: rgba(240,235,228,.82); padding: .65rem 1rem; color: var(--ff-deep); font: inherit; font-size: .8rem; font-weight: 800; cursor: pointer; }
        @media (max-width: 800px) { .auth-page { position: relative; padding: 4.5rem 16px 4rem; }.auth-back-home { top: 1rem; left: 1rem; }.auth-shell { display: block; border-radius: 1.4rem; }.auth-welcome { min-height: 31rem; padding: 2.5rem 1.7rem 1.8rem; }.auth-form-area, .auth-page-signup .auth-form-area { padding: 2.2rem 1.35rem 3rem; }.auth-form-wrap { margin-top: 2.8rem; }.join-intro { padding: 2.8rem 1.35rem .5rem; }.join-intro h1 { font-size: clamp(3rem, 13vw, 4.5rem); }.join-role-grid { grid-template-columns: 1fr; gap: 1rem; margin-top: 2rem; }.join-role-card { min-height: 0; }.join-role-visual { min-height: 10rem; }.join-role-body h2 { font-size: 1.55rem; }.join-role-summary { min-height: 0; }.join-role-cta { margin-top: 1rem; }.auth-welcome h1 { font-size: clamp(3.5rem, 15vw, 5rem); }.otp-cells { gap: .35rem; }.otp-cell { font-size: 1.1rem; }.auth-progress { font-size: .58rem; gap: .5rem; }.auth-progress i { width: 1.5rem; } }
        @media (prefers-reduced-motion: reduce) { .auth-shell, .auth-route-line span, .auth-submit, .join-role-card, .join-role-visual img, .join-role-cta { animation: none; transition: none; } }
      `}</style>
    </main>
  )
}
