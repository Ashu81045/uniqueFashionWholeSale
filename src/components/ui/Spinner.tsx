type Tone = 'brand' | 'white' | 'dark'

const toneClasses: Record<Tone, string> = {
  brand: 'border-slate-300 border-t-blue-600',
  white: 'border-white/30 border-t-white',
  // For spinners shown on solid gold (primary button) backgrounds — dark
  // spinner to match the button's dark text, not white.
  dark: 'border-slate-50/30 border-t-slate-50',
}

export function Spinner({ tone = 'brand', className = '' }: { tone?: Tone; className?: string }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 ${toneClasses[tone]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
