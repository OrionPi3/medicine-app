import { useState, type FormEvent } from 'react'

import { GlassButton, GlassCard } from '@/components/liquid-glass'
import type { Medicine } from '@/types'
import { headingClass, inputClass, labelClass, panelClass } from '@/ui'

type Props = {
  medicines: Medicine[]
  onAdd: (m: Omit<Medicine, 'id'>) => void
  onEdit: (id: string, patch: Omit<Medicine, 'id'>) => void
  onDelete: (id: string) => void
  onRefill: (id: string, amount: number) => void
}

type EditProps = {
  med: Medicine
  onSave: (patch: Omit<Medicine, 'id'>) => void
  onCancel: () => void
}

function EditForm({ med, onSave, onCancel }: EditProps) {
  const [name, setName] = useState(med.name)
  const [mg, setMg] = useState(String(med.mg))
  const [quantity, setQuantity] = useState(String(med.quantity))
  const [lowAt, setLowAt] = useState(String(med.lowAt))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      mg: Number(mg) || 0,
      quantity: Number(quantity) || 0,
      lowAt: Number(lowAt) || 0,
    })
  }

  return (
    <form onSubmit={submit} className={`space-y-4 ${panelClass}`}>
      <h3 className={headingClass}>Edit medicine</h3>
      <div>
        <label htmlFor={`edit-name-${med.id}`} className={labelClass}>
          Name
        </label>
        <input
          id={`edit-name-${med.id}`}
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`edit-mg-${med.id}`} className={labelClass}>
            mg
          </label>
          <input
            id={`edit-mg-${med.id}`}
            className={inputClass}
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={mg}
            onChange={(e) => setMg(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`edit-qty-${med.id}`} className={labelClass}>
            Quantity
          </label>
          <input
            id={`edit-qty-${med.id}`}
            className={inputClass}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`edit-low-${med.id}`} className={labelClass}>
            Warn at
          </label>
          <input
            id={`edit-low-${med.id}`}
            className={inputClass}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={lowAt}
            onChange={(e) => setLowAt(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <GlassButton type="submit" material="tinted" className="bg-sky-600 text-white">
          Save
        </GlassButton>
        <button type="button" onClick={onCancel} className="cursor-pointer text-sm text-white/70 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function MedicinesTab({ medicines, onAdd, onEdit, onDelete, onRefill }: Props) {
  const [name, setName] = useState('')
  const [mg, setMg] = useState('')
  const [quantity, setQuantity] = useState('')
  const [lowAt, setLowAt] = useState('7')
  const [editingId, setEditingId] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      mg: Number(mg) || 0,
      quantity: Number(quantity) || 0,
      lowAt: Number(lowAt) || 0,
    })
    setName('')
    setMg('')
    setQuantity('')
  }

  const refill = (m: Medicine) => {
    const raw = window.prompt(`How many units of ${m.name} did you add?`)
    const n = Number(raw)
    if (raw && n > 0) onRefill(m.id, n)
  }

  const remove = (m: Medicine) => {
    if (window.confirm(`Delete ${m.name}? It will also be removed from any groups.`)) onDelete(m.id)
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className={`space-y-4 ${panelClass}`}>
        <h2 className={headingClass}>Add a medicine</h2>
        <div>
          <label htmlFor="med-name" className={labelClass}>
            Name
          </label>
          <input
            id="med-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ibuprofen"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="med-mg" className={labelClass}>
              mg
            </label>
            <input
              id="med-mg"
              className={inputClass}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={mg}
              onChange={(e) => setMg(e.target.value)}
              placeholder="200"
            />
          </div>
          <div>
            <label htmlFor="med-qty" className={labelClass}>
              Quantity
            </label>
            <input
              id="med-qty"
              className={inputClass}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="30"
            />
          </div>
          <div>
            <label htmlFor="med-low" className={labelClass}>
              Warn at
            </label>
            <input
              id="med-low"
              className={inputClass}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={lowAt}
              onChange={(e) => setLowAt(e.target.value)}
            />
          </div>
        </div>
        <GlassButton type="submit" material="tinted" className="bg-sky-600 text-white">
          Add medicine
        </GlassButton>
      </form>

      <section className="space-y-3">
        <h2 className={headingClass}>Your medicines</h2>
        {medicines.length === 0 && <p className="text-white/60">Nothing here yet. Add your first one above.</p>}
        {medicines.map((m) => {
          if (m.id === editingId) {
            return (
              <EditForm
                key={m.id}
                med={m}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => {
                  onEdit(m.id, patch)
                  setEditingId(null)
                }}
              />
            )
          }

          const low = m.quantity <= m.lowAt
          return (
            <GlassCard key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{m.name}</p>
                  <p className="text-sm opacity-60">{m.mg} mg</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-semibold tabular-nums ${low ? 'text-rose-500' : ''}`}>{m.quantity}</p>
                  <p className="text-xs opacity-60">{low ? 'running low' : 'left'}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-5 text-sm font-medium">
                <button type="button" onClick={() => setEditingId(m.id)} className="cursor-pointer hover:underline">
                  Edit
                </button>
                <button type="button" onClick={() => refill(m)} className="cursor-pointer hover:underline">
                  Refill
                </button>
                <button type="button" onClick={() => remove(m)} className="cursor-pointer text-rose-500 hover:underline">
                  Delete
                </button>
              </div>
            </GlassCard>
          )
        })}
      </section>
    </div>
  )
}