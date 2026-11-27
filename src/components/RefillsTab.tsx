import { useState, type FormEvent } from 'react'

import { GlassButton, GlassCard } from '@/components/liquid-glass'
import type { Medicine } from '@/types'
import { headingClass, inputClass, labelClass } from '@/ui'

type Props = {
  medicines: Medicine[]
  onRefill: (id: string, amount: number) => void
  onUpdate: (id: string, patch: Partial<Omit<Medicine, 'id'>>) => void
}

const toNum = (v: string) => (v === '' ? undefined : Math.max(0, Number(v)))
const show = (n?: number) => (n === undefined ? '—' : String(n))

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{show(value)}</p>
    </div>
  )
}

type CardProps = { med: Medicine } & Pick<Props, 'onRefill' | 'onUpdate'>

function RefillCard({ med, onRefill, onUpdate }: CardProps) {
  const [amount, setAmount] = useState('')
  const [editing, setEditing] = useState(med.weekNeed === undefined && med.inBottle === undefined)
  const [week, setWeek] = useState(String(med.weekNeed ?? ''))
  const [bottle, setBottle] = useState(String(med.inBottle ?? ''))
  const n = Number(amount)

  const startEdit = () => {
    setWeek(String(med.weekNeed ?? ''))
    setBottle(String(med.inBottle ?? ''))
    setEditing(true)
  }

  const saveNumbers = (e: FormEvent) => {
    e.preventDefault()
    onUpdate(med.id, { weekNeed: toNum(week), inBottle: toNum(bottle) })
    setEditing(false)
  }

  const submitRefill = (e: FormEvent) => {
    e.preventDefault()
    if (n > 0) {
      onRefill(med.id, n)
      setAmount('')
    }
  }

  return (
    <GlassCard className="p-4">
      <div>
        <p className="text-lg font-semibold">{med.name}</p>
        <p className="text-sm opacity-60">{med.mg} mg</p>
      </div>

      {editing ? (
        <form onSubmit={saveNumbers} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`week-${med.id}`} className={labelClass}>
                To take this week
              </label>
              <input
                id={`week-${med.id}`}
                className={inputClass}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`bottle-${med.id}`} className={labelClass}>
                Left in bottle
              </label>
              <input
                id={`bottle-${med.id}`}
                className={inputClass}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={bottle}
                onChange={(e) => setBottle(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <GlassButton type="submit" size="sm" material="tinted" className="bg-sky-600 text-white">
              Save
            </GlassButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="cursor-pointer text-sm text-white/70 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3">
            <Stat label="Take this week" value={med.weekNeed} />
            <Stat label="Left in bottle" value={med.inBottle} />
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="cursor-pointer pb-1 text-sm font-medium hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      <form onSubmit={submitRefill} className="mt-4 flex items-center gap-3">
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

export function RefillsTab({ medicines, onRefill, onUpdate }: Props) {
  const low = medicines.filter((m) => m.quantity <= m.lowAt)

  return (
    <div className="space-y-4">
      <h2 className={headingClass}>Needs refilling</h2>
      <p className="text-sm text-white/60">
        Ticking doses on Home lowers "To take this week" only. "Left in bottle" is yours to set.
      </p>
      {low.length === 0 && <p className="text-white/60">Nothing needs refilling right now.</p>}
      {low.map((m) => (
        <RefillCard key={m.id} med={m} onRefill={onRefill} onUpdate={onUpdate} />
      ))}
    </div>
  )
}