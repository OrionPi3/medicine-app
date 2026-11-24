import { GlassButton, GlassCard } from '@/components/liquid-glass'
import { isTaken, slotsOn } from '@/schedule'
import type { Group, GroupItem, LogEntry, Medicine } from '@/types'
import { headingClass } from '@/ui'

type Props = {
  medicines: Medicine[]
  groups: Group[]
  logs: LogEntry[]
  onTake: (items: GroupItem[], group: { id: string; name: string } | null, slot: string | null) => void
  onUndo: (entry: LogEntry) => void
}

const when = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export function LogTab({ medicines, groups, logs, onTake, onUndo }: Props) {
  const now = new Date()
  const slots = slotsOn(groups, medicines, now)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className={headingClass}>Today</h2>
        {slots.length === 0 && (
          <p className="text-white/60">Nothing scheduled today. Use "Single medicine" below, or create a group.</p>
        )}
        {slots.map((s) => {
          const done = isTaken(s, now, logs)
          return (
            <GlassCard key={s.key} className={`p-4 ${done ? 'ring-2 ring-emerald-400' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    {s.time} <span className="font-normal opacity-60">· {s.group.name}</span>
                  </p>
                  {done && <p className="text-sm text-emerald-400">Taken today</p>}
                </div>
                <GlassButton
                  material="tinted"
                  className="bg-emerald-600 text-white"
                  onClick={() => onTake(s.items, { id: s.group.id, name: s.group.name }, s.time)}
                >
                  {done ? 'Take again' : 'Take all'}
                </GlassButton>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {s.items.map((it) => {
                  const m = medicines.find((x) => x.id === it.medicineId)
                  if (!m) return null
                  return (
                    <li key={it.medicineId} className="flex justify-between">
                      <span>
                        {m.name} <span className="opacity-60">{m.mg} mg × {it.dose}</span>
                      </span>
                      <span className="opacity-60">{m.quantity} left</span>
                    </li>
                  )
                })}
              </ul>
            </GlassCard>
          )
        })}
      </section>

      <section className="space-y-3">
        <h2 className={headingClass}>Single medicine</h2>
        {medicines.length === 0 && <p className="text-white/60">No medicines yet.</p>}
        <ul className="space-y-2">
          {medicines.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {m.name} <span className="text-white/60">{m.mg} mg</span>
                </p>
                <p className="text-xs text-white/60">{m.quantity} left</p>
              </div>
              <GlassButton size="sm" onClick={() => onTake([{ medicineId: m.id, dose: 1 }], null, null)}>
                Take 1
              </GlassButton>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className={headingClass}>History</h2>
        {logs.length === 0 && <p className="text-white/60">Nothing logged yet.</p>}
        <ul className="space-y-2">
          {logs.slice(0, 20).map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
            >
              <div>
                <p>
                  {l.medicineName} {l.mg} mg × {l.dose}
                  {l.groupName && <span className="text-white/50"> · {l.groupName}</span>}
                </p>
                <p className="text-xs text-white/50">{when(l.takenAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => onUndo(l)}
                className="cursor-pointer text-xs font-medium text-white/60 hover:text-white"
              >
                Undo
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}