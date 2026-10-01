import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CalendarDays,
  FileCheck2,
  Lock,
  Unlock,
} from 'lucide-react'
import {
  todayDateKey,
  yesterdayDateKey,
  lastNDateKeys,
  startOfMonthDateKey,
  formatDisplayDate,
} from '../../../lib/utils/date'
import type { DayClosure } from '../../../types/dayClose'

export type DatePreset = 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'

interface DateRangeFilterBarProps {
  startDate: string
  endDate: string
  onChange: (start: string, end: string, preset: DatePreset) => void
  currentPreset: DatePreset
  dayClosure?: DayClosure | null
}

export function DateRangeFilterBar({
  startDate,
  endDate,
  onChange,
  currentPreset,
  dayClosure,
}: DateRangeFilterBarProps) {
  const today = todayDateKey()
  const yesterday = yesterdayDateKey()

  const isSingleDay = startDate === endDate

  const dateDescription = useMemo(() => {
    if (isSingleDay) {
      if (startDate === today) return `Aaj / Today (${formatDisplayDate(new Date(`${startDate}T00:00:00`))})`
      if (startDate === yesterday) return `Kal / Yesterday (${formatDisplayDate(new Date(`${startDate}T00:00:00`))})`
      return formatDisplayDate(new Date(`${startDate}T00:00:00`))
    }
    return `${formatDisplayDate(new Date(`${startDate}T00:00:00`))} — ${formatDisplayDate(
      new Date(`${endDate}T00:00:00`),
    )}`
  }, [startDate, endDate, isSingleDay, today, yesterday])

  function handleSelectPreset(preset: DatePreset) {
    if (preset === 'today') {
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
      onChange(startDate, endDate, 'custom')
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm shadow-black/20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Presets Button Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar size={13} className="text-blue-400" />
            Tareekh / Period:
          </span>

          <button
            type="button"
            onClick={() => handleSelectPreset('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentPreset === 'today'
                ? 'bg-blue-600 text-slate-50 shadow-sm shadow-black/30'
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
                ? 'bg-blue-600 text-slate-50 shadow-sm shadow-black/30'
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
                ? 'bg-blue-600 text-slate-50 shadow-sm shadow-black/30'
                : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
            }`}
          >
            Pichhle 7 Din
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('30days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentPreset === '30days'
                ? 'bg-blue-600 text-slate-50 shadow-sm shadow-black/30'
                : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
            }`}
          >
            Pichhle 30 Din
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentPreset === 'month'
                ? 'bg-blue-600 text-slate-50 shadow-sm shadow-black/30'
                : 'bg-slate-200 text-slate-300 hover:bg-slate-300 hover:text-slate-100'
            }`}
          >
            Is Mahine (Month)
          </button>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Se (From):</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                if (!e.target.value) return
                const newStart = e.target.value
                const newEnd = newStart > endDate ? newStart : endDate
                onChange(newStart, newEnd, 'custom')
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Tak (To):</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                if (!e.target.value) return
                const newEnd = e.target.value
                const newStart = newEnd < startDate ? newEnd : startDate
                onChange(newStart, newEnd, 'custom')
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Status Line with Period Summary and Day Close link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 text-xs">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-blue-400 shrink-0" />
          <span className="text-slate-300">
            Hisaab ka Samay: <strong className="text-slate-100">{dateDescription}</strong>
          </span>
        </div>

        {/* Day Close Status pill if single day is selected */}
        {isSingleDay && (
          <div className="flex items-center gap-2">
            {dayClosure?.status === 'closed' ? (
              <span className="flex items-center gap-1.5 rounded-md bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                <Lock size={11} />
                <span>Gulla Band (Closed)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-md bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                <Unlock size={11} />
                <span>Gulla Chalu (Open)</span>
              </span>
            )}

            <Link
              to={`/day-close/${startDate}`}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              <FileCheck2 size={12} />
              <span>{dayClosure?.status === 'closed' ? 'Gulla Hisaab Dekhein' : 'Gulla Band Karein'}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
