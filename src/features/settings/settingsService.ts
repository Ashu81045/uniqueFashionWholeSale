import { getDoc, setDoc } from 'firebase/firestore'
import { settingsDocRef } from '../../firebase/firestore'
import { BUSINESS_SETTINGS_DOC_ID, type BusinessSettings } from '../../types/settings'

export async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  const snap = await getDoc(settingsDocRef(BUSINESS_SETTINGS_DOC_ID))
  return snap.exists() ? snap.data() : null
}

export async function saveBusinessSettings(settings: BusinessSettings): Promise<void> {
  await setDoc(settingsDocRef(BUSINESS_SETTINGS_DOC_ID), settings, { merge: true })
}
