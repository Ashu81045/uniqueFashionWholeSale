import {
  collection,
  collectionGroup,
  doc,
  type CollectionReference,
  type DocumentReference,
  type FirestoreDataConverter,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './config'
import type { AppUser } from '../types/user'
import type { Customer } from '../types/customer'
import type { CustomerPayment } from '../types/payment'
import type { Bill } from '../types/bill'
import type { DailyStats } from '../types/dailyStats'
import type { MonthlyStats } from '../types/monthlyStats'
import type { BillCounter } from '../types/counter'
import type { BusinessSettings } from '../types/settings'
import type { GlobalStats } from '../types/globalStats'
import type { ProductSuggestion } from '../types/productSuggestion'

/** Converter that strips/re-attaches the doc id so `id` never has to be stored as a field. */
function converter<T extends { id?: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T) {
      const rest: Partial<T> = { ...data }
      delete rest.id
      return rest
    },
    fromFirestore(snapshot: QueryDocumentSnapshot) {
      return { id: snapshot.id, ...snapshot.data() } as T
    },
  }
}

// users/{uid} — no id field on AppUser itself (uid doubles as id), plain pass-through converter.
const usersConverter: FirestoreDataConverter<AppUser> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as AppUser,
}

export const usersCol = (): CollectionReference<AppUser> =>
  collection(db, 'users').withConverter(usersConverter)
export const userDocRef = (uid: string): DocumentReference<AppUser> =>
  doc(db, 'users', uid).withConverter(usersConverter)

// customers/{mobile} — doc id is the mobile number; Customer itself has no `id` field.
const customersConverter: FirestoreDataConverter<Customer> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as Customer,
}

export const customersCol = (): CollectionReference<Customer> =>
  collection(db, 'customers').withConverter(customersConverter)
export const customerDocRef = (mobile: string): DocumentReference<Customer> =>
  doc(db, 'customers', mobile).withConverter(customersConverter)

// customers/{mobile}/payments/{id}
export const customerPaymentsCol = (mobile: string): CollectionReference<CustomerPayment> =>
  collection(db, 'customers', mobile, 'payments').withConverter(converter<CustomerPayment>())

// collectionGroup('payments') — every customer's payments, for the global Payment History view.
const paymentsGroupConverter: FirestoreDataConverter<CustomerPayment> = {
  toFirestore(data: CustomerPayment) {
    const rest: Partial<CustomerPayment> = { ...data }
    delete rest.id
    delete rest.customerMobile
    return rest
  },
  fromFirestore(snapshot: QueryDocumentSnapshot) {
    return {
      id: snapshot.id,
      customerMobile: snapshot.ref.parent.parent?.id,
      ...snapshot.data(),
    } as CustomerPayment
  },
}

export const paymentsCollectionGroup = (): Query<CustomerPayment> =>
  collectionGroup(db, 'payments').withConverter(paymentsGroupConverter)

// bills/{autoId}
export const billsCol = (): CollectionReference<Bill> =>
  collection(db, 'bills').withConverter(converter<Bill>())
export const billDocRef = (billId: string): DocumentReference<Bill> =>
  doc(db, 'bills', billId).withConverter(converter<Bill>())

// dailyStats/{YYYY-MM-DD} — doc id is the date; DailyStats has no `id` field.
const dailyStatsConverter: FirestoreDataConverter<DailyStats> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as DailyStats,
}

export const dailyStatsDocRef = (dateId: string): DocumentReference<DailyStats> =>
  doc(db, 'dailyStats', dateId).withConverter(dailyStatsConverter)

// monthlyStats/{YYYY-MM} — doc id is the month; MonthlyStats has no `id` field.
const monthlyStatsConverter: FirestoreDataConverter<MonthlyStats> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as MonthlyStats,
}

export const monthlyStatsDocRef = (monthId: string): DocumentReference<MonthlyStats> =>
  doc(db, 'monthlyStats', monthId).withConverter(monthlyStatsConverter)

// counters/billCounter
const counterConverter: FirestoreDataConverter<BillCounter> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as BillCounter,
}

export const counterDocRef = (counterId: string): DocumentReference<BillCounter> =>
  doc(db, 'counters', counterId).withConverter(counterConverter)

// settings/{settingId}
const settingsConverter: FirestoreDataConverter<BusinessSettings> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as BusinessSettings,
}

export const settingsDocRef = (settingId: string): DocumentReference<BusinessSettings> =>
  doc(db, 'settings', settingId).withConverter(settingsConverter)

// globalStats/outstanding
const globalStatsConverter: FirestoreDataConverter<GlobalStats> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as GlobalStats,
}

export const globalStatsDocRef = (statId: string): DocumentReference<GlobalStats> =>
  doc(db, 'globalStats', statId).withConverter(globalStatsConverter)

// productSuggestions/{normalizedName}
const productSuggestionConverter: FirestoreDataConverter<ProductSuggestion> = {
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as ProductSuggestion,
}

export const productSuggestionsCol = (): CollectionReference<ProductSuggestion> =>
  collection(db, 'productSuggestions').withConverter(productSuggestionConverter)
export const productSuggestionDocRef = (normalizedName: string): DocumentReference<ProductSuggestion> =>
  doc(db, 'productSuggestions', normalizedName).withConverter(productSuggestionConverter)

// dayClosures/{YYYY-MM-DD}
export const dayClosuresCol = (): CollectionReference<import('../types/dayClose').DayClosure> =>
  collection(db, 'dayClosures').withConverter(converter<import('../types/dayClose').DayClosure>())

export const dayClosureDocRef = (date: string): DocumentReference<import('../types/dayClose').DayClosure> =>
  doc(db, 'dayClosures', date).withConverter(converter<import('../types/dayClose').DayClosure>())

