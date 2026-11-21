import assert from 'node:assert/strict'
import { createScreenWakeLock } from '../dist/wake-lock.mjs'

class Sentinel extends EventTarget {
 released = false
 async release() {
  this.released = true
  this.dispatchEvent(new Event('release'))
 }
}

let visible = true
let requests = 0
let status
let sentinel
const lock = createScreenWakeLock({
 request: async () => {requests++; sentinel = new Sentinel(); return sentinel},
 isVisible: () => visible,
 onStatus: next => {status = next}
})
await lock.sync(false)
assert.equal(requests, 0)
await lock.sync(true)
assert.equal(status, 'active')
await lock.sync(true)
assert.equal(requests, 1)
visible = false
await lock.sync(true)
assert.equal(status, 'paused')
assert.equal(sentinel.released, true)
visible = true
await lock.sync(true)
assert.equal(requests, 2)
assert.equal(status, 'active')
await sentinel.release()
assert.equal(status, 'blocked')
await lock.sync(true)
assert.equal(status, 'active')
await lock.sync(false)
assert.equal(status, 'off')
assert.equal(sentinel.released, true)

let resolve
const late = new Sentinel()
const pending = createScreenWakeLock({
 request: () => new Promise(done => {resolve = done}),
 isVisible: () => true,
 onStatus: next => {status = next}
})
const acquiring = pending.sync(true)
await pending.sync(false)
resolve(late)
await acquiring
assert.equal(status, 'off')
assert.equal(late.released, true)

const denied = createScreenWakeLock({
 request: async () => {throw new Error('NotAllowedError')},
 isVisible: () => true,
 onStatus: next => {status = next}
})
await denied.sync(true)
assert.equal(status, 'blocked')

const unsupported = createScreenWakeLock({request: null, isVisible: () => true, onStatus: next => {status = next}})
assert.equal(unsupported.supported, false)
await unsupported.sync(true)
assert.equal(status, 'unsupported')
console.log('Testy zapobiegania wygaszaniu zakończone pomyślnie.')
