import { useState } from 'react'

import { GlassButton, GlassCard, GlassTabs } from '@/components/liquid-glass'
import { DAY_NAMES, addDays, sameDay, startOfWeek } from '@/days'
import { isTaken, slotsOn, type Slot } from '@/schedule'
import type { Group, LogEntry, Medicine } from '@/types'

type Props = { medicines: Medicine[]; groups: Group[]; logs: LogEntry[] }
type View = 'day' | 'week'
type Status = 'taken' | 'due' | 'missed' | 'upcoming'

const badge: Record<Status, { label: string; cls: string }> = {
  taken: { label: 'Taken', cls: 'bg-emerald-500/25 text-emerald-300' },
  due: { label: 'Due', cls: 'bg-amber-400/25 text-amber-200' },
  missed: { label: 'Not logged', cls: 'bg-white/10 text-white/60' },
  upcoming: { label: 'Upcoming', cls: 'bg-cyan-400/20 text-cyan-200' },
}

const statusOf = (slot: Slot, date: Date, logs: LogEntry[], now: Date): Status => {
  if (isTaken(slot, date, logs)) return 'taken'
  const [h, m] = slot.time.split(':').map(Number)
  const due = new Date(date)
  due.setHours(h, m, 0, 0)
  if (due.getTime() > now.getTime()) return 'upcoming'
  return sameDay(date, now) ? 'due' : 'missed'
}

const shortDate = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' })

type RowProps = {
  slot: Slot
  date: Date
  medicines: Medicine[]
  logs: LogEntry[]
  now: Date
  glass: boolean
}

function SlotRow({ slot, date, medicines, logs, now, glass }: RowProps) {
  const b = badge[statusOf(slot, date, logs, now)]
  const items = slot.items.flatMap((it) => {
    const m = medicines.find((x) => x.id === it.medicineId)
    return m ? [{ m, dose: it.dose }] : []
  })

  const body = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-semibold">
          {slot.time} <span className="font-normal opacity-60">· {slot.group.name}</span>
        </p>
        <p className="mt-1 text-sm opacity-70">
          {items.map(({ m, dose }) => `${m.name} ${m.mg} mg × ${dose}`).join(', ')}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${b.cls}`}>{b.label}</span>
    </div>
  )

  if (glass) return <GlassCard className="p-4">{body}</GlassCard>
  return <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">{body}</div>
}

export function HomeTab({ medicines, groups, logs }: Props) {
  const [view, setView] = useState<View>('day')
  const [date, setDate] = useState(() => new Date())
  const now = new Date()

  const step = view === 'day' ? 1 : 7
  const weekStart = startOfWeek(date)
  const lowMeds = medicines.filter((m) => m.quantity <= m.lowAt)
  const daySlots = slotsOn(groups, medicines, date)

  const title =
    view === 'day' ? DAY_NAMES[date.getDay()] : `${shortDate(weekStart)} – ${shortDate(addDays(weekStart, 6))}`
  const subtitle = view === 'day' ? (sameDay(date, now) ? `Today · ${shortDate(date)}` : shortDate(date)) : 'Full week'
  const onToday = view === 'day' ? sameDay(date, now) : sameDay(weekStart, startOfWeek(now))

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <GlassTabs
          aria-label="Day or week view"
          size="sm"
          highlightClassName="bg-cyan-900"
          value={view}
          onValueChange={(v) => v && setView(v as View)}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <GlassButton aria-label="Previous" onClick={() => setDate((d) => addDays(d, -step))}>
          ←
        </GlassButton>
        <div className="text-center">
          <p className="text-2xl font-bold tracking-tight">{title}</p>
          <p className="text-sm text-white/60">{subtitle}</p>
          {!onToday && (
            <button
              type="button"
              onClick={() => setDate(new Date())}
              className="mt-1 cursor-pointer text-xs font-medium text-cyan-300 hover:underline"
            >
              Back to today
            </button>
          )}
        </div>
        <GlassButton aria-label="Next" onClick={() => setDate((d) => addDays(d, step))}>
          →
        </GlassButton>
      </div>

      {view === 'day' ? (
        <div className="space-y-3">
          {daySlots.length === 0 && <p className="text-center text-white/60">Nothing scheduled for this day.</p>}
          {daySlots.map((s) => (
            <SlotRow key={s.key} slot={s} date={date} medicines={medicines} logs={logs} now={now} glass />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
            const slots = slotsOn(groups, medicines, d)
            const today = sameDay(d, now)
            return (
              <section key={d.toDateString()} className="space-y-2">
                <p className={`text-sm font-semibold ${today ? 'text-cyan-300' : 'text-white/70'}`}>
                  {DAY_NAMES[d.getDay()]} <span className="font-normal opacity-60">{shortDate(d)}</span>
                </p>
                {slots.length === 0 && <p className="text-sm text-white/40">Nothing scheduled.</p>}
                {slots.map((s) => (
                  <SlotRow key={s.key} slot={s} date={d} medicines={medicines} logs={logs} now={now} glass={false} />
                ))}
              </section>
            )
          })}
        </div>
      )}

      <hr className="border-white/25" />

      {lowMeds.length > 0 ? (
        <div>
          <p className="font-semibold text-red-400">Running low</p>
          <ul className="mt-2 space-y-1 text-red-400">
            {lowMeds.map((m) => (
              <li key={m.id}>
                {m.name} {m.mg} mg: {m.quantity} left
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-white/50">No medicines running low.</p>
      )}
    </div>
  )
}