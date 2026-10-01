import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-100 shadow-sm shadow-black/20 ${
        hover ? 'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/30' : ''
      } ${className}`}
      {...props}
    />
  )
}
