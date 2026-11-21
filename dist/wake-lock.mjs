export function createScreenWakeLock({ request, isVisible, onStatus }) {
 let lock = null
 let pending = false
 const shouldHold = () => isVisible() && enabled
 let enabled = false

 async function sync(preference) {
  enabled = preference
  if (!request) {
   onStatus('unsupported')
   return
  }
  if (!shouldHold()) {
   const previous = lock
   lock = null
   onStatus(enabled ? 'paused' : 'off')
   if (previous && !previous.released) await previous.release().catch(() => {})
   return
  }
  if (pending || (lock && !lock.released)) return

  pending = true
  onStatus('pending')
  try {
   const next = await request()
   if (!shouldHold()) {
    void next.release().catch(() => {})
    return
   }
   if (next.released) {
    onStatus('blocked')
    return
   }
   lock = next
   next.addEventListener('release', () => {
    if (lock !== next) return
    lock = null
    onStatus(shouldHold() ? 'blocked' : enabled ? 'paused' : 'off')
   }, { once: true })
   onStatus('active')
  } catch {
   if (shouldHold()) onStatus('blocked')
  } finally {
   pending = false
  }
 }
 return { supported: Boolean(request), sync }
}
