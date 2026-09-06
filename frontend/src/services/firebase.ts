import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB3kwYRr8mVUXwBeL80tBMBJiCYWJzNbjU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kisan-setu-7b90e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kisan-setu-7b90e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kisan-setu-7b90e.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '108231669385275734804',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:108231669385275734804:web:dummyappid',
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app)

let recaptchaVerifier: RecaptchaVerifier | null = null

export function getOrCreateRecaptchaVerifier(): RecaptchaVerifier {
  if (recaptchaVerifier) {
    return recaptchaVerifier
  }

  let elem = document.getElementById('recaptcha-container')
  if (!elem) {
    elem = document.createElement('div')
    elem.id = 'recaptcha-container'
    elem.style.display = 'none'
    document.body.appendChild(elem)
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, elem, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
        recaptchaVerifier = null
      }
    },
  })

  return recaptchaVerifier
}

export async function sendFirebaseOtp(phoneNumber: string): Promise<ConfirmationResult> {
  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(0, 10)
  const formattedPhone = `+91${cleanPhone}`
  const verifier = getOrCreateRecaptchaVerifier()
  const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier)
  return confirmationResult
}

export async function verifyFirebaseOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<{ user: User; idToken: string }> {
  const result = await confirmationResult.confirm(otpCode)
  const user = result.user
  const idToken = await user.getIdToken()
  return { user, idToken }
}

export type { ConfirmationResult, User }