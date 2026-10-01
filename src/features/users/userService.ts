import { initializeApp, deleteApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { firebaseConfig } from '../../firebase/config'
import { userDocRef, usersCol } from '../../firebase/firestore'
import type { AppUser, UserRole } from '../../types/user'

export async function fetchUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(usersCol(), orderBy('name')))
  return snap.docs.map((d) => d.data())
}

/**
 * Creates a new staff login. Firebase Auth has no client-side "create another
 * user without switching sessions" API, so this uses a throwaway secondary
 * Firebase App instance — createUserWithEmailAndPassword runs against that
 * instance's own Auth, leaving the admin's session (default app) untouched.
 * The new user's Firestore doc is written via the app's normal (primary) db.
 */
export async function createStaffUser(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`)
  try {
    const secondaryAuth = getAuth(secondaryApp)
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const uid = credential.user.uid

    await setDoc(userDocRef(uid), {
      uid,
      name,
      email,
      role,
      active: true,
      createdAt: serverTimestamp() as unknown as AppUser['createdAt'],
    })

    await signOut(secondaryAuth).catch(() => {})
    return uid
  } finally {
    await deleteApp(secondaryApp).catch(() => {})
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(userDocRef(uid), { role })
}

export async function setUserActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(userDocRef(uid), { active })
}
