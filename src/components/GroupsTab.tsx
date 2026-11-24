import { useState, type FormEvent } from 'react'

import { GlassButton, GlassCard } from '@/components/liquid-glass'
import { ALL_DAYS, DAY_SHORT, daysOf } from '@/days'
import type { Group, Medicine } from '@/types'
import { doseInputClass, headingClass, inputClass, labelClass, panelClass } from '@/ui'

type Props = {
  medicines: Medicine[]
  groups: Group[]
  onAdd: (g: Omit<Group, 'id'>) => void
  onEdit: (id: string, g: Omit<Group, 'id'>) => void
  onDelete: (id: string) => void
}

type Picked = { dose: number; times: string[] }

// Monday first, to match the week view
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function GroupsTab({ medicines, groups, onAdd, onEdit, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [time, setTime] = useState('08:00')
  const [days, setDays] = useState<number[]>(ALL_DAYS)
  const [picked, setPicked] = useState<Record<string, Picked>>({}) // medicineId -> dose + own times

  const reset = () => {
    setEditingId(null)
    setName('')
    setTime('08:00')
    setDays(ALL_DAYS)
    setPicked({})
  }

  const startEdit = (g: Group) => {
    setEditingId(g.id)
    setName(g.name)
    setTime(g.time)
    setDays(daysOf(g))
    setPicked(
      Object.fromEntries(
        g.items
          .filter((it) => medicines.some((m) => m.id === it.medicineId))
          .map((it) => [it.medicineId, { dose: it.dose, times: it.times ?? [] }]),
      ),
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggle = (id: string, on: boolean) =>
    setPicked((p) => {
      const next = { ...p }
      if (on) next[id] = next[id] ?? { dose: 1, times: [] }
      else delete next[id]
      return next
    })

  const setDose = (id: string, dose: number) => setPicked((p) => ({ ...p, [id]: { ...p[id], dose } }))

  const updateTimes = (id: string, fn: (t: string[]) => string[]) =>
    setPicked((p) => ({ ...p, [id]: { ...p[id], times: fn(p[id].times) } }))

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const items = Object.entries(picked)
      .filter(([, v]) => v.dose > 0)
      .map(([medicineId, v]) => {
        const own = [...new Set(v.times.filter(Boolean))].sort()
        return { medicineId, dose: v.dose, times: own.length > 0 ? own : undefined }
      })
    if (!name.trim() || items.length === 0 || days.length === 0) return

    const data = { name: name.trim(), time, days: [...days].sort(), items }
    if (editingId) onEdit(editingId, data)
    else onAdd(data)
    reset()
  }

  const dayLabel = (g: Group) => {
    const d = daysOf(g)
    return d.length === 7 ? 'Every day' : DAY_ORDER.filter((x) => d.includes(x)).map((x) => DAY_SHORT[x]).join(', ')
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className={`space-y-4 ${panelClass}`}>
        <h2 className={headingClass}>{editingId ? 'Edit group' : 'New group'}</h2>
        <p className="text-sm text-white/60">
          Medicines in a group share the group's reminder time. Give one its own time (or several) if it differs.
        </p>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor="group-name" className={labelClass}>
              Group name
            </label>
            <input
              id="group-name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morning"
              required
            />
          </div>
          <div>
            <label htmlFor="group-time" className={labelClass}>
              Group time
            </label>
            <input
              id="group-time"
              className={inputClass}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <p className={labelClass}>Days</p>
          <div className="flex flex-wrap gap-2">
            {DAY_ORDER.map((d) => {
              const on = days.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d)}
                  className={`h-9 min-w-12 cursor-pointer rounded-full px-3 text-sm font-medium ${
                    on ? 'bg-cyan-500 text-neutral-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {DAY_SHORT[d]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <p className={labelClass}>Medicines in this group</p>
          {medicines.length === 0 && <p className="text-white/60">Add some medicines first.</p>}
          {medicines.map((m) => {
            const p = picked[m.id]
            return (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-5 accent-sky-400"
                      checked={!!p}
                      onChange={(e) => toggle(m.id, e.target.checked)}
                    />
                    <span>
                      {m.name} <span className="text-white/60">{m.mg} mg</span>
                    </span>
                  </label>
                  {p && (
                    <label className="flex items-center gap-2 text-sm text-white/60">
                      dose
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        className={doseInputClass}
                        value={p.dose}
                        onChange={(e) => setDose(m.id, Number(e.target.value))}
                      />
                    </label>
                  )}
                </div>

                {p && (
                  <div className="ml-8 space-y-2">
                    <p className="text-xs text-white/50">
                      {p.times.length === 0 ? `Uses the group time (${time})` : 'Own times:'}
                    </p>
                    {p.times.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="time"
                          className={`${doseInputClass} w-32`}
                          value={t}
                          onChange={(e) =>
                            updateTimes(m.id, (arr) => arr.map((x, j) => (j === i ? e.target.value : x)))
                          }
                        />
                        <button
                          type="button"
                          aria-label="Remove time"
                          onClick={() => updateTimes(m.id, (arr) => arr.filter((_, j) => j !== i))}
                          className="cursor-pointer px-2 text-white/60 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateTimes(m.id, (arr) => [...arr, time])}
                      className="cursor-pointer text-xs font-medium text-cyan-300 hover:underline"
                    >
                      + Own time (use more than once for several times a day)
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <GlassButton type="submit" material="tinted" className="bg-sky-600 text-white">
            {editingId ? 'Save changes' : 'Create group'}
          </GlassButton>
          {editingId && (
            <button type="button" onClick={reset} className="cursor-pointer text-sm text-white/70 hover:text-white">
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className={headingClass}>Your groups</h2>
        {groups.length === 0 && <p className="text-white/60">No groups yet.</p>}
        {groups.map((g) => (
          <GlassCard key={g.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{g.name}</p>
                <p className="text-sm opacity-60">
                  {g.time} · {dayLabel(g)}
                </p>
              </div>
              <div className="flex gap-4 text-sm font-medium">
                <button type="button" onClick={() => startEdit(g)} className="cursor-pointer hover:underline">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Delete group "${g.name}"?`)) return
                    if (editingId === g.id) reset()
                    onDelete(g.id)
                  }}
                  className="cursor-pointer text-rose-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {g.items.map((it) => {
                const m = medicines.find((x) => x.id === it.medicineId)
                if (!m) return null
                return (
                  <li key={it.medicineId} className="flex justify-between gap-3">
                    <span>
                      {m.name} <span className="opacity-60">{m.mg} mg</span>
                    </span>
                    <span className="text-right opacity-60">
                      × {it.dose}
                      {it.times && it.times.length > 0 && ` · at ${it.times.join(', ')}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          </GlassCard>
        ))}
      </section>
    </div>
  )
}