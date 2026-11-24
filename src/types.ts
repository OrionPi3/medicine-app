export type Medicine = {
  id: string
  name: string
  mg: number
  quantity: number // units left (pills, capsules...)
  lowAt: number // warn when quantity <= this
}

export type GroupItem = {
  medicineId: string
  dose: number
  times?: string[] // own reminder times "HH:MM"; empty or missing = use the group's time
}

export type Group = {
  id: string
  name: string
  time: string // the group's default time, "HH:MM", 24h
  days?: number[] // 0 = Sunday ... 6 = Saturday; missing = every day
  items: GroupItem[]
}

export type LogEntry = {
  id: string
  medicineId: string
  medicineName: string
  mg: number
  dose: number
  groupId: string | null
  groupName: string | null
  slot?: string | null // the reminder time this dose belonged to
  takenAt: string // ISO date
}