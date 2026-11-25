import { useState, type FormEvent } from 'react'

import { GlassButton, GlassCard } from '@/components/liquid-glass'
import type { Medicine } from '@/types'
import { headingClass, inputClass } from '@/ui'

type Props = {
  medicines: Medicine[]
  onRefill: (id: string, amount: number) => void
}

function RefillCard({ med, onRefill }: { med: Medicine; onRefill: Props['onRefill'] }) {
  const [amount, setAmount] = useState('')
  const n = Number(amount)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (n > 0) {
      onRefill(med.id, n)
      setAmount('')
    }
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{med.name}</p>
          <p className="text-sm opacity-60">{med.mg} mg</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-rose-500 tabular-nums">{med.quantity}</p>
          <p className="text-xs opacity-60">left · warns at {med.lowAt}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 flex items-center gap-3">
        <input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          aria-label={`Quantity of ${med.name} you received`}
          placeholder="Quantity you got"
          className={`${inputClass} min-w-0 flex-1`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <GlassButton type="submit" material="tinted" className="bg-emerald-600 text-white" disabled={!(n > 0)}>
          Refill
        </GlassButton>
      </form>
    </GlassCard>
  )
}

export function RefillsTab({ medicines, onRefill }: Props) {
  const low = medicines.filter((m) => m.quantity <= m.lowAt)

  return (
    <div className="space-y-4">
      <h2 className={headingClass}>Needs refilling</h2>
      {low.length === 0 && <p className="text-white/60">Nothing needs refilling right now.</p>}
      {low.map((m) => (
        <RefillCard key={m.id} med={m} onRefill={onRefill} />
      ))}
    </div>
  )
}