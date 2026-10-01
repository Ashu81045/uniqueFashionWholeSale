import { useEffect } from 'react'
import { getDoc } from 'firebase/firestore'
import { onAuthChanged } from '../firebase/auth'
import { userDocRef } from '../firebase/firestore'
import { useAuthStore } from '../stores/authStore'

/**
 * Bootstraps the auth session once per app load: listens for Firebase Auth
 * state, then reads users/{uid} exactly once to resolve the role. Role is
 * cached in the persisted authStore afterwards — no repeated reads per page.
 */
export function useAuthSession() {
  const setSession = useAuthStore((s) => s.setSession)
  const setStatus = useAuthStore((s) => s.setStatus)

  useEffect(() => {
    setStatus('loading')
    const unsubscribe = onAuthChanged(async (user) => {
      console.log('[AuthSession] onAuthChanged triggered:', user ? { uid: user.uid, email: user.email } : 'No user')
      if (!user) {
        setSession(null)
        setStatus('ready')
        return
      }
      try {
        console.log(`[AuthSession] Fetching user profile from Firestore: users/${user.uid}`)
        const snap = await getDoc(userDocRef(user.uid))
        if (!snap.exists()) {
          console.warn(
            `[AuthSession] Authenticated in Firebase Auth as ${user.email} (${user.uid}), but document users/${user.uid} does NOT exist in Firestore. A matching Firestore document with { uid, name, role: 'admin' | 'accountant', active: true } is required.`,
          )
          setSession(null)
          setStatus('ready')
          return
        }
        if (!snap.data().active) {
          console.warn(`[AuthSession] User document users/${user.uid} exists, but active is false.`)
          setSession(null)
          setStatus('ready')
          return
        }
        const data = snap.data()
        console.log(`[AuthSession] Session successfully established:`, { uid: user.uid, name: data.name, role: data.role })
        setSession({ uid: user.uid, name: data.name, role: data.role })
        setStatus('ready')
      } catch (err) {
        // Most commonly: Firestore rules not deployed yet, or network failure
        console.error('[AuthSession] Failed to load users/{uid} from Firestore:', err)
        setSession(null)
        setStatus('ready')
      }
    })
    return unsubscribe
  }, [setSession, setStatus])
}
