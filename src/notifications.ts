export type Perm = NotificationPermission | 'unsupported'

export const getPermission = (): Perm =>
  'Notification' in window ? Notification.permission : 'unsupported'

export async function requestPermission(): Promise<Perm> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.requestPermission()
}

export async function notify(title: string, body: string) {
  if (getPermission() !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, { body, tag: `${title}-${body}` })
      return
    }
  } catch {
    // fall through to the plain Notification API
  }
  try {
    new Notification(title, { body })
  } catch {
    // ignore
  }
}