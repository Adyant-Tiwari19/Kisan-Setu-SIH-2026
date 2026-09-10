import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { useTranslation } from 'react-i18next'

export function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [name, setName] = useState(user?.name || '')
  const [address, setAddress] = useState(user?.address || '')
  const [pincode, setPincode] = useState(user?.pincode || '')
  const [accountNumber, setAccountNumber] = useState(user?.account_num || '')
  const [ifsc, setIfsc] = useState(user?.ifsc || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return null
  }

  const isFarmer = user.role === 'farmer'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!name.trim() || !address.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setError('Enter a name, address, and valid 6-digit pincode.')
      return
    }

    if (isFarmer && accountNumber && !/^\d{9,18}$/.test(accountNumber.trim())) {
      setError('Account number must contain 9 to 18 digits.')
      return
    }

    if (isFarmer && ifsc && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc.trim())) {
      setError('Enter a valid 11-character IFSC code.')
      return
    }

    setIsSaving(true)
    try {
      await authService.updateCurrentUserProfile({
        name,
        address,
        pincode,
        ...(isFarmer ? { account_num: accountNumber, ifsc } : {}),
      })
      navigate(-1)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="section-shell py-10 md:py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Account settings</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Edit your profile</h1>
            <p className="mt-2 text-sm text-slate-500">Keep your contact and delivery details up to date.</p>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              {t('name')}
              <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" required />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              {t('mobileNumber')}
              <input value={user.phone} readOnly className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            {t('address')}
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" required />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            {t('pincode')}
            <input value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" required />
          </label>

          {isFarmer && (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Account number
                <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 18))} inputMode="numeric" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                IFSC code
                <input value={ifsc} onChange={(event) => setIfsc(event.target.value.toUpperCase().slice(0, 11))} maxLength={11} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </label>
            </div>
          )}

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <button type="submit" disabled={isSaving} className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? 'Saving changes...' : 'Save changes'}
          </button>
        </form>
      </div>
    </section>
  )
}
