import { useState } from 'react'
import { useProductSuggestions } from '../../../hooks/useProductSuggestions'

export function ProductNameInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  const suggestions = useProductSuggestions(value)
  const showDropdown = focused && value.trim().length > 0 && suggestions.length > 0

  return (
    <div className="relative">
      <input
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 animate-fade-in overflow-y-auto rounded-lg border border-slate-200 bg-slate-100 py-1 shadow-md shadow-black/30">
          {suggestions.map((s) => (
            <button
              key={s.nameLower}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(s.name)
                setFocused(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-950/40"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
