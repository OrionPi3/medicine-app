import { daysOf, sameDay } from '@/days'
import type { Group, GroupItem, LogEntry, Medicine } from '@/types'

// A slot = one reminder: a group at one time, with the medicines due then.
export type Slot = {
  key: string // groupId@HH:MM
  group: Group
  time: string
  items: GroupItem[]
}

export const itemTimes = (g: Group, it: GroupItem) =>
  it.times && it.times.length > 0 ? [...new Set(it.times)] : [g.time]

export function slotsOfGroup(g: Group, medicines: Medicine[]): Slot[] {
  const byTime = new Map<string, GroupItem[]>()
  for (const it of g.items) {
    if (!medicines.some((m) => m.id === it.medicineId)) continue
    for (const t of itemTimes(g, it)) byTime.set(t, [...(byTime.get(t) ?? []), it])
  }
  return [...byTime.entries()].map(([time, items]) => ({ key: `${g.id}@${time}`, group: g, time, items }))
}

export function slotsOn(groups: Group[], medicines: Medicine[], date: Date): Slot[] {
  return groups
    .filter((g) => daysOf(g).includes(date.getDay()))
    .flatMap((g) => slotsOfGroup(g, medicines))
    .sort((a, b) => a.time.localeCompare(b.time))
}

export const isTaken = (slot: Slot, date: Date, logs: LogEntry[]) =>
  slot.items.every((it) =>
    logs.some(
      (l) =>
        l.groupId === slot.group.id &&
        l.medicineId === it.medicineId &&
        (l.slot ?? slot.group.time) === slot.time &&
        sameDay(new Date(l.takenAt), date),
    ),
  )