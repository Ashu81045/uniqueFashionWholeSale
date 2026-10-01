/** Local (not UTC) YYYY-MM-DD key, used as dailyStats doc ids so dashboards read known ids. */
export function toDateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayDateKey(): string {
  return toDateKey(new Date())
}

export function yesterdayDateKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateKey(d)
}

export function startOfMonthDateKey(): string {
  const d = new Date()
  d.setDate(1)
  return toDateKey(d)
}

/** Generates inclusive array of YYYY-MM-DD keys between start and end dates. */
export function getDateKeysBetween(startKey: string, endKey: string): string[] {
  if (startKey > endKey) {
    const tmp = startKey
    startKey = endKey
    endKey = tmp
  }
  const [sY, sM, sD] = startKey.split('-').map(Number)
  const [eY, eM, eD] = endKey.split('-').map(Number)
  const start = new Date(sY, sM - 1, sD)
  const end = new Date(eY, eM - 1, eD)

  const keys: string[] = []
  const cur = new Date(start)
  // Safety guard against runaway loops: limit max to 365 days
  let count = 0
  while (cur <= end && count < 366) {
    keys.push(toDateKey(cur))
    cur.setDate(cur.getDate() + 1)
    count++
  }
  return keys
}

/** Last `days` date keys ending today (inclusive), oldest first. */
export function lastNDateKeys(days: number): string[] {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(toDateKey(d))
  }
  return keys
}

/** Local YYYY-MM key, used as monthlyStats doc ids. */
export function toMonthKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function currentMonthKey(): string {
  return toMonthKey(new Date())
}

/** Month key for `monthsAgo` months before today (0 = current month), oldest-first when mapped. */
export function monthKeyOffset(monthsAgo: number): string {
  const d = new Date()
  d.setDate(1) // avoid month-length rollover surprises before subtracting months
  d.setMonth(d.getMonth() - monthsAgo)
  return toMonthKey(d)
}

export function formatDisplayDate(d: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
