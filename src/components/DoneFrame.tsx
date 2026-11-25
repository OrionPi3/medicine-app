import type { ReactNode } from 'react'

// Green outline + soft glow drawn over a card once its dose is done.
// It is its own element on top (not a ring on the glass card), so the glass can't hide it.
export function DoneFrame({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[28px] border-2 transition-all duration-300 ${
          done ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_24px_rgba(52,199,89,0.35)]' : 'border-transparent'
        }`}
      />
    </div>
  )
}