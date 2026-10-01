import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`min-h-11 rounded-lg border border-slate-300 px-3 py-2.5 text-base transition-shadow duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-50 disabled:text-slate-400 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
        {...props}
      />
      {error && <span className="animate-fade-in text-xs text-red-400">{error}</span>}
    </div>
  )
}
