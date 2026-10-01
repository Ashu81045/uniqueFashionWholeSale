import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBQmXWVKPn2Fxq03K4l-BmUKKE2GG-VtK0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'uniquefashion-3500b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'uniquefashion-3500b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'uniquefashion-3500b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '38405639761',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:38405639761:web:2270d1c166f7f602c23270',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// This project's Firestore database defaults to "default" (as created in Google Cloud Console),
// but can be overridden with VITE_FIREBASE_DATABASE_ID if using implicit "(default)".
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || 'default'
export const db = getFirestore(app, databaseId)
