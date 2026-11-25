import { useEffect, useRef, useState } from 'react'

import { GlassButton, GlassTabs } from '@/components/liquid-glass'
import { GroupsTab } from '@/components/GroupsTab'
import { HomeTab } from '@/components/HomeTab'
import { LogTab } from '@/components/LogTab'
import { MedicinesTab } from '@/components/MedicinesTab'
import { RefillsTab } from '@/components/RefillsTab'
import { sameDay } from '@/days'
import { getPermission, notify, requestPermission, type Perm } from '@/notifications'
import { isTaken, slotsOn, type Slot } from '@/schedule'
import { uid, useLocalStorage } from '@/storage'
import type { Group, GroupItem, LogEntry, Medicine } from '@/types'

type Tab = 'home' | 'log' | 'medicines' | 'groups' | 'refills'
type Alert = { id: string; text: string }

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [medicines, setMedicines] = useLocalStorage<Medicine[]>('medtrack:medicines', [])
  const [groups, setGroups] = useLocalStorage<Group[]>('medtrack:groups', [])
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('medtrack:logs', [])
  const [lowNotified, setLowNotified] = useLocalStorage<string[]>('medtrack:lowNotified', [])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [perm, setPerm] = useState<Perm>(getPermission)
  const fired = useRef(new Set<string>())

  /* ---------- actions ---------- */

  const addMedicine = (m: Omit<Medicine, 'id'>) => setMedicines((prev) => [...prev, { ...m, id: uid() }])

  const editMedicine = (id: string, patch: Omit<Medicine, 'id'>) =>
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))

  const deleteMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id))
    setGroups((prev) => prev.map((g) => ({ ...g, items: g.items.filter((i) => i.medicineId !== id) })))
  }

  const refill = (id: string, amount: number) =>
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, quantity: m.quantity + amount } : m)))

  const addGroup = (g: Omit<Group, 'id'>) => setGroups((prev) => [...prev, { ...g, id: uid() }])

  const editGroup = (id: string, g: Omit<Group, 'id'>) =>
    setGroups((prev) => prev.map((x) => (x.id === id ? { ...g, id } : x)))

  const deleteGroup = (id: string) => setGroups((prev) => prev.filter((g) => g.id !== id))

  const take = (items: GroupItem[], group: { id: string; name: string } | null, slot: string | null) => {
    const now = new Date().toISOString()
    const entries: LogEntry[] = items.flatMap((it) => {
      const m = medicines.find((x) => x.id === it.medicineId)
      if (!m) return []
      return [
        {
          id: uid(),
          medicineId: m.id,
          medicineName: m.name,
          mg: m.mg,
          dose: it.dose,
          groupId: group?.id ?? null,
          groupName: group?.name ?? null,
          slot,
          takenAt: now,
        },
      ]
    })

    setLogs((prev) => [...entries, ...prev].slice(0, 300))
    // one shared stock per medicine, however many times a day it is taken
    setMedicines((prev) =>
      prev.map((m) => {
        const it = items.find((i) => i.medicineId === m.id)
        return it ? { ...m, quantity: Math.max(0, m.quantity - it.dose) } : m
      }),
    )
    if (group && slot) setAlerts((a) => a.filter((x) => !x.id.startsWith(`${group.id}@${slot}|`)))
  }

  // unticking a group: remove that slot's logs for the day and put the tablets back
  const untake = (slot: Slot, date: Date) => {
    const gone = logs.filter(
      (l) =>
        l.groupId === slot.group.id &&
        (l.slot ?? slot.group.time) === slot.time &&
        sameDay(new Date(l.takenAt), date) &&
        slot.items.some((it) => it.medicineId === l.medicineId),
    )
    if (gone.length === 0) return

    const ids = new Set(gone.map((l) => l.id))
    setLogs((prev) => prev.filter((l) => !ids.has(l.id)))
    setMedicines((prev) =>
      prev.map((m) => {
        const back = gone.filter((l) => l.medicineId === m.id).reduce((sum, l) => sum + l.dose, 0)
        return back > 0 ? { ...m, quantity: m.quantity + back } : m
      }),
    )
  }

  const undo = (entry: LogEntry) => {
    setLogs((prev) => prev.filter((l) => l.id !== entry.id))
    setMedicines((prev) =>
      prev.map((m) => (m.id === entry.medicineId ? { ...m, quantity: m.quantity + entry.dose } : m)),
    )
  }

  /* ---------- reminders (checks every 15s while the app is open) ---------- */

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const today = now.toDateString()

      for (const slot of slotsOn(groups, medicines, now)) {
        const [h, m] = slot.time.split(':').map(Number)
        const diff = nowMin - (h * 60 + m)
        if (diff < 0 || diff > 10) continue // fire within 10 min after the set time

        const key = `${slot.key}|${today}`
        if (fired.current.has(key)) continue
        fired.current.add(key)

        if (isTaken(slot, now, logs)) continue

        const names = slot.items
          .map((it) => medicines.find((x) => x.id === it.medicineId)?.name)
          .filter(Boolean)
          .join(', ')

        setAlerts((a) => [...a, { id: key, text: `${slot.group.name} (${slot.time}): time to take ${names}` }])
        notify(`${slot.group.name} · ${slot.time}`, `Time to take: ${names}`)
      }
    }

    check()
    const id = setInterval(check, 15000)
    return () => clearInterval(id)
  }, [groups, logs, medicines])

  /* ---------- low stock notifications ---------- */

  const lowMeds = medicines.filter((m) => m.quantity <= m.lowAt)

  useEffect(() => {
    const lowIds = lowMeds.map((m) => m.id)
    const fresh = lowMeds.filter((m) => !lowNotified.includes(m.id))
    fresh.forEach((m) => notify('Running low', `${m.name} ${m.mg} mg: ${m.quantity} left`))
    const next = [...lowNotified.filter((id) => lowIds.includes(id)), ...fresh.map((m) => m.id)]
    if (fresh.length || next.length !== lowNotified.length) setLowNotified(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicines])

  /* ---------- UI ---------- */

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0b1030] text-white">
      {/* colourful backdrop so the glass has something to bend */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <span className="absolute -top-24 -left-16 size-80 rounded-full bg-[#22d3ee]" />
        <span className="absolute top-48 -right-24 size-72 rounded-full bg-[#a855f7]" />
        <span className="absolute -bottom-28 left-10 size-96 rounded-full bg-[#ec4899]" />
        <span className="absolute -right-10 -bottom-40 size-80 rounded-full bg-[#1d4ed8]" />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/35" />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">MedTrack</h1>
          {perm === 'default' && (
            <GlassButton size="sm" onClick={async () => setPerm(await requestPermission())}>
              Enable reminders
            </GlassButton>
          )}
        </header>

        {(perm === 'denied' || perm === 'unsupported') && (
          <p className="text-sm text-white/60">
            Notifications are off or blocked in this browser, so reminders will only show inside the app.
          </p>
        )}

        {alerts.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-400/20 px-4 py-3"
          >
            <p className="font-medium">{a.text}</p>
            <button
              type="button"
              onClick={() => setAlerts((x) => x.filter((y) => y.id !== a.id))}
              className="cursor-pointer text-sm text-white/70 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        ))}

        <div className="flex justify-center">
          <GlassTabs
            aria-label="Sections"
            size="md"
            highlightClassName="bg-cyan-900"
            value={tab}
            onValueChange={(v) => v && setTab(v as Tab)}
            options={[
              { value: 'home', label: 'Home' },
              { value: 'log', label: 'Log' },
              { value: 'medicines', label: 'Meds' },
              { value: 'groups', label: 'Groups' },
              { value: 'refills', label: lowMeds.length > 0 ? `Refills (${lowMeds.length})` : 'Refills' },
            ]}
          />
        </div>

        {tab === 'home' && (
          <HomeTab medicines={medicines} groups={groups} logs={logs} onTake={take} onUntake={untake} />
        )}
        {tab === 'log' && <LogTab medicines={medicines} groups={groups} logs={logs} onTake={take} onUndo={undo} />}
        {tab === 'medicines' && (
          <MedicinesTab
            medicines={medicines}
            onAdd={addMedicine}
            onEdit={editMedicine}
            onDelete={deleteMedicine}
            onRefill={refill}
          />
        )}
        {tab === 'groups' && (
          <GroupsTab
            medicines={medicines}
            groups={groups}
            onAdd={addGroup}
            onEdit={editGroup}
            onDelete={deleteGroup}
          />
        )}
        {tab === 'refills' && <RefillsTab medicines={medicines} onRefill={refill} />}

        <p className="pt-6 text-center text-xs text-white/40">
          MedTrack is a reminder tool, not medical advice. Follow your prescriber's instructions.
        </p>
      </div>
    </div>
  )
}