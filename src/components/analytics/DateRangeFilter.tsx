import { useMemo } from 'react'
import { Calendar, CalendarDays } from 'lucide-react'
import {
  todayDateKey,
  yesterdayDateKey,
  lastNDateKeys,
  startOfMonthDateKey,
  formatDisplayDate,
} from '../../lib/utils/date'

export type PeriodPreset = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'

interface DateRangeFilterProps {
  startDate: string | null
  endDate: string | null
  currentPreset: PeriodPreset
  onChange: (start: string | null, end: string | null, preset: PeriodPreset) => void
  showAllOption?: boolean
  className?: string
}

export function DateRangeFilter({
  startDate,
  endDate,
  currentPreset,
  onChange,
  showAllOption = true,
  className = '',
}: DateRangeFilterProps) {
  const today = todayDateKey()
  const yesterday = yesterdayDateKey()

  function handleSelectPreset(preset: PeriodPreset) {
    if (preset === 'all') {
      onChange(null, null, 'all')
    } else if (preset === 'today') {
      onChange(today, today, 'today')
    } else if (preset === 'yesterday') {
      onChange(yesterday, yesterday, 'yesterday')
    } else if (preset === '7days') {
      const keys = lastNDateKeys(7)
      onChange(keys[0], keys[keys.length - 1], '7days')
    } else if (preset === '30days') {
      const keys = lastNDateKeys(30)
      onChange(keys[0], keys[keys.length - 1], '30days')
    } else if (preset === 'month') {
      onChange(startOfMonthDateKey(), today, 'month')
    } else {
      onChange(startDate || today, endDate || today, 'custom')
    }
  }

  const rangeDescription = useMemo(() => {
    if (currentPreset === 'all' || (!startDate && !endDate)) {
      return 'Sabhi Tareekh (All-Time Activity)'
    }
    if (startDate === endDate && startDate) {
      if (startDate === today) return `Aaj (${formatDisplayDate(new Date(`${startDate}T00:00:00`))})`
      if (startDate === yesterday) return `Kal (${formatDisplayDate(new Date(`${startDate}T00:00:00`))})`
      return formatDisplayDate(new Date(`${startDate}T00:00:00`))
    }
    if (startDate && endDate) {
      return `${formatDisplayDate(new Date(`${startDate}T00:00:00`))} — ${formatDisplayDate(
        new Date(`${endDate}T00:00:00`),
      )}`
    }
    return 'Custom Filter'
  }, [currentPreset, startDate, endDate, today, yesterday])

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm shadow-black/20 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Presets Button Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar size={13} className="text-blue-400" />
            Filter:
          </span>

          {showAllOption && (
            <button
              type="button"
              onClick={() => handleSelectPreset('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                currentPreset === 'all'
                  ? 'bg-blue-600 text-slate-50 shadow-sm'
                  : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
              }`}
            >
              Sabhi (All)
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelectPreset('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentPreset === 'today'
                ? 'bg-blue-600 text-slate-50 shadow-sm'
                : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
            }`}
          >
            Aaj (Today)
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('yesterday')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentPreset === 'yesterday'
                ? 'bg-blue-600 text-slate-50 shadow-sm'
                : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
            }`}
          >
            Kal (Yesterday)
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('7days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentPreset === '7days'
                ? 'bg-blue-600 text-slate-50 shadow-sm'
                : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
            }`}
          >
            7 Din
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentPreset === 'month'
                ? 'bg-blue-600 text-slate-50 shadow-sm'
                : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
            }`}
          >
            Is Mahine
          </button>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Se (From):</span>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => {
                if (!e.target.value) return
                const newStart = e.target.value
                const currentEnd = endDate || today
                const newEnd = newStart > currentEnd ? newStart : currentEnd
                onChange(newStart, newEnd, 'custom')
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Tak (To):</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => {
                if (!e.target.value) return
                const newEnd = e.target.value
                const currentStart = startDate || today
                const newStart = newEnd < currentStart ? newEnd : currentStart
                onChange(newStart, newEnd, 'custom')
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Range Status Bar */}
      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={13} className="text-blue-400" />
          <span>
            Chuna Samay: <strong className="text-slate-200">{rangeDescription}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
