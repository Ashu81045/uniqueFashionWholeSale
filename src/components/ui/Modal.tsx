import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
}

export function Modal({
  title,
  onClose,
  children,
  size = 'md',
  className = '',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  size?: ModalSize
  className?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeClasses[size] || 'sm:max-w-md'} max-h-[90vh] flex flex-col animate-slide-up rounded-t-2xl border border-slate-200 bg-slate-100 text-slate-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:animate-scale-in sm:rounded-2xl sm:pb-5 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="-m-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
          {children}
        </div>
      </div>
    </div>
  )
}
