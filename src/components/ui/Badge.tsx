import type { ReactNode } from 'react'

type Tone = 'green' | 'amber' | 'red' | 'slate' | 'blue'

// Dark-tinted chip + bright text + subtle ring reads better on a dark
// surface than a pale pastel pill would (which looks like a cutout).
const toneClasses: Record<Tone, string> = {
  green: 'bg-green-950/60 text-green-400 ring-1 ring-inset ring-green-700/60',
  amber: 'bg-amber-950/60 text-amber-400 ring-1 ring-inset ring-amber-700/60',
  red: 'bg-red-950/60 text-red-400 ring-1 ring-inset ring-red-700/60',
  slate: 'bg-slate-200/60 text-slate-700 ring-1 ring-inset ring-slate-300/60',
  blue: 'bg-blue-950/60 text-blue-400 ring-1 ring-inset ring-blue-700/60',
}

const dotClasses: Record<Tone, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
}

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />
      {children}
    </span>
  )
}
