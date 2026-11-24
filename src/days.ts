import type { Group } from '@/types'

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

// groups saved before days existed count as every day
export const daysOf = (g: Group) => g.days ?? ALL_DAYS

export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// Monday of the week containing d
export const startOfWeek = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}