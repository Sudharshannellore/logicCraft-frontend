import { useEffect, useRef } from 'react'

/**
 * 8-bit game sounds, synthesised with the Web Audio API (no audio files). Every sound is a short list of
 * tones. Clicks, tabs, toggles, dropdowns and links get their sound from `installUiSounds`; outcomes
 * (tests passed, XP earned, level up, time up…) call `playSound` where they happen.
 *
 * The player's "Sound effects" setting turns them all off; it's mirrored in localStorage so signed-out
 * pages respect it too.
 */

export type SoundName =
  // Interface
  | 'click' | 'select' | 'tab' | 'toggleOn' | 'toggleOff' | 'open' | 'close' | 'back' | 'step' | 'nav' | 'copy' | 'hint' | 'jump'
  // Running code
  | 'run' | 'submit' | 'success' | 'fail' | 'error' | 'reveal'
  // Rewards
  | 'coin' | 'spend' | 'levelUp' | 'victory' | 'defeat' | 'lessonComplete' | 'stageClear' | 'claim' | 'purchase' | 'unlock' | 'magic'
  // Social and timers
  | 'aiReply' | 'notify' | 'friend' | 'remove' | 'duel' | 'start' | 'tick' | 'timeUp'
  // Session
  | 'signIn' | 'signOut' // prettier-ignore

interface Tone {
  /** Frequency in Hz. */
  f: number
  /** Slide to this frequency by the end of the tone. */
  to?: number
  /** Start, in seconds after the sound starts. */
  t?: number
  /** Duration in seconds. */
  d: number
  w?: OscillatorType | 'noise'
  /** Volume, 0–1. */
  v?: number
}

interface Sound {
  tones: Tone[]
  /** A jingle waits for the previous jingle to finish instead of playing over it. */
  jingle?: boolean
}

/** A run of notes, `step` seconds apart; the last one rings for `last`. */
const seq = (notes: number[], step: number, { w = 'square', v = 0.5, last = step, at = 0 }: { w?: OscillatorType; v?: number; last?: number; at?: number } = {}): Tone[] =>
  notes.map((f, i) => ({ f, t: at + i * step, d: i === notes.length - 1 ? last : step, w, v }))

const SOUNDS: Record<SoundName, Sound> = {
  click: { tones: [{ f: 880, to: 660, d: 0.04, v: 0.35 }] },
  select: { tones: [{ f: 740, d: 0.03, v: 0.3 }] },
  tab: { tones: seq([660, 990], 0.035, { v: 0.3 }) },
  toggleOn: { tones: seq([440, 880], 0.05, { v: 0.35 }) },
  toggleOff: { tones: seq([880, 440], 0.05, { v: 0.35 }) },
  open: { tones: [{ f: 330, to: 660, d: 0.1, w: 'triangle', v: 0.6 }] },
  close: { tones: [{ f: 660, to: 330, d: 0.1, w: 'triangle', v: 0.6 }] },
  back: { tones: seq([523, 392], 0.045, { v: 0.35 }) },
  step: { tones: seq([523, 659, 784], 0.05, { v: 0.35, last: 0.08 }) },
  nav: { tones: [{ f: 587, d: 0.035, v: 0.4 }, { f: 880, to: 1175, t: 0.035, d: 0.06, v: 0.4 }] },
  copy: { tones: seq([1568, 2093], 0.035, { v: 0.3 }) },
  hint: { tones: seq([1047, 1397, 1760], 0.06, { w: 'triangle', last: 0.12 }) },
  jump: { tones: [{ f: 300, to: 900, d: 0.15, v: 0.35 }] },

  run: { tones: seq([392, 523], 0.06, { v: 0.4 }) },
  submit: { tones: seq([523, 659, 784, 1047], 0.045, { v: 0.4 }) },
  success: { tones: seq([784, 1047], 0.08, { v: 0.45, last: 0.14 }) },
  fail: {
    tones: [
      { f: 311, to: 290, d: 0.14, w: 'sawtooth', v: 0.4 },
      { f: 233, to: 180, t: 0.14, d: 0.24, w: 'sawtooth', v: 0.4 },
    ],
  },
  error: {
    tones: [
      { f: 140, d: 0.09, w: 'sawtooth', v: 0.45 },
      { f: 140, t: 0.12, d: 0.12, w: 'sawtooth', v: 0.45 },
    ],
  },
  reveal: { tones: [...seq([659, 988], 0.05, { w: 'triangle' }), { f: 1319, t: 0.1, d: 0.12, w: 'triangle', v: 0.35 }] },

  coin: { tones: [{ f: 988, d: 0.06, v: 0.35 }, { f: 1319, t: 0.06, d: 0.2, v: 0.35 }] },
  spend: { tones: [{ f: 1319, to: 659, d: 0.14, v: 0.3 }] },
  levelUp: {
    jingle: true,
    tones: [...seq([523, 659, 784, 1047, 1319, 1568], 0.07, { v: 0.4 }), { f: 2093, t: 0.42, d: 0.4, v: 0.4 }, { f: 262, t: 0.42, d: 0.4, w: 'triangle', v: 0.6 }],
  },
  victory: {
    jingle: true,
    tones: [
      ...seq([392, 523, 659, 784, 659], 0.09, { v: 0.4 }),
      { f: 784, t: 0.45, d: 0.45, v: 0.4 },
      ...seq([196, 262, 330], 0.18, { w: 'triangle', v: 0.6, last: 0.45, at: 0.09 }),
    ],
  },
  defeat: {
    jingle: true,
    tones: [...seq([392, 370, 349], 0.16, { v: 0.35 }), { f: 330, to: 247, t: 0.48, d: 0.55, w: 'square', v: 0.35 }],
  },
  lessonComplete: {
    jingle: true,
    tones: [...seq([659, 784, 1047, 784, 1047], 0.08, { v: 0.4 }), { f: 1319, t: 0.4, d: 0.35, v: 0.4 }],
  },
  stageClear: { jingle: true, tones: seq([784, 1047, 1319, 1568], 0.06, { v: 0.4, last: 0.2 }) },
  claim: {
    jingle: true,
    tones: [{ f: 200, d: 0.08, w: 'noise', v: 0.35 }, ...seq([659, 880, 1175, 1568], 0.07, { v: 0.4, last: 0.25, at: 0.08 })],
  },
  purchase: { jingle: true, tones: [...seq([988, 1319], 0.06, { v: 0.35 }), ...seq([1319, 1568, 2093], 0.08, { w: 'triangle', last: 0.3, at: 0.14 })] },
  unlock: { tones: [{ f: 440, to: 880, d: 0.12, v: 0.35 }, ...seq([1760, 2093], 0.06, { w: 'triangle', last: 0.15, at: 0.12 })] },
  magic: { tones: [{ f: 880, to: 1760, d: 0.2, w: 'triangle', v: 0.5 }, ...seq([1568, 2093, 2637], 0.05, { w: 'triangle', v: 0.35, last: 0.12, at: 0.18 })] },

  aiReply: { tones: [{ f: 1047, d: 0.05, v: 0.3 }, { f: 1319, t: 0.07, d: 0.06, v: 0.3 }] },
  notify: { tones: [{ f: 1175, d: 0.09, w: 'triangle', v: 0.6 }, { f: 1568, t: 0.11, d: 0.16, w: 'triangle', v: 0.6 }] },
  friend: { tones: seq([523, 659, 784, 1047], 0.07, { w: 'triangle', v: 0.6, last: 0.18 }) },
  remove: { tones: [{ f: 392, to: 196, d: 0.16, v: 0.3 }] },
  duel: { tones: [{ f: 3000, d: 0.07, w: 'noise', v: 0.4 }, { f: 1568, to: 784, t: 0.02, d: 0.16, v: 0.35 }, { f: 2349, to: 1175, t: 0.06, d: 0.14, v: 0.2 }] },
  start: { tones: [{ f: 440, d: 0.09, v: 0.4 }, { f: 440, t: 0.18, d: 0.09, v: 0.4 }, { f: 880, t: 0.36, d: 0.22, v: 0.4 }] },
  tick: { tones: [{ f: 1760, d: 0.025, v: 0.25 }] },
  timeUp: { jingle: true, tones: seq([880, 660, 880, 660, 880, 660], 0.09, { v: 0.4, last: 0.2 }) },

  signIn: { jingle: true, tones: [{ f: 262, to: 1047, d: 0.25, v: 0.35 }, { f: 1568, t: 0.25, d: 0.15, w: 'triangle', v: 0.5 }] },
  signOut: { tones: [{ f: 1047, to: 131, d: 0.35, v: 0.3 }] },
}

const MASTER_VOLUME = 0.25
const STORAGE_KEY = 'logicraft-sound'

let enabled = readEnabled()
let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let jingleEndsAt = 0
const lastPlayed = new Map<SoundName, number>()

function readEnabled() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

export function isSoundEnabled() {
  return enabled
}

/** Mirrors the player's "Sound effects" setting. */
export function setSoundEnabled(on: boolean) {
  enabled = on
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
  } catch {
    // Storage unavailable — the choice lasts until the tab closes.
  }
}

function audio(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  master = ctx.createGain()
  master.gain.value = MASTER_VOLUME
  master.connect(ctx.destination)
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}

function schedule(audioCtx: AudioContext, sound: Sound) {
  const now = audioCtx.currentTime
  const length = Math.max(...sound.tones.map((tone) => (tone.t ?? 0) + tone.d))
  const start = sound.jingle ? Math.max(now, jingleEndsAt) : now
  if (sound.jingle) jingleEndsAt = start + length

  for (const tone of sound.tones) {
    const at = start + (tone.t ?? 0)
    const end = at + tone.d
    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(tone.v ?? 0.5, at)
    gain.gain.exponentialRampToValueAtTime(0.001, end)
    gain.connect(master!)

    if (tone.w === 'noise') {
      const source = audioCtx.createBufferSource()
      source.buffer = noise
      const filter = audioCtx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = tone.f
      source.connect(filter).connect(gain)
      source.start(at)
      source.stop(end)
    } else {
      const osc = audioCtx.createOscillator()
      osc.type = tone.w ?? 'square'
      osc.frequency.setValueAtTime(tone.f, at)
      if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, end)
      osc.connect(gain)
      osc.start(at)
      osc.stop(end)
    }
  }
}

export function playSound(name: SoundName) {
  if (!enabled || typeof window === 'undefined') return
  const sound = SOUNDS[name]
  const now = performance.now()
  // Ignore double triggers of the same sound.
  if (now - (lastPlayed.get(name) ?? 0) < 40) return
  lastPlayed.set(name, now)

  const audioCtx = audio()
  if (!audioCtx) return
  if (audioCtx.state === 'running') return schedule(audioCtx, sound)
  // Browsers only start audio after a user gesture; drop the sound if it would arrive late.
  void audioCtx
    .resume()
    .then(() => {
      if (performance.now() - now < 300) schedule(audioCtx, sound)
    })
    .catch(() => undefined)
}

const QUIET = 'input, textarea, select, [contenteditable="true"], .monaco-editor'
const INTERACTIVE = 'button, a[href], [role="tab"], [role="switch"], [role="button"], summary, label'

/** The sound a click on this element makes; `data-sound` on it (or an ancestor) overrides, `none` silences. */
function soundForClick(target: Element): SoundName | null {
  const tagged = target.closest<HTMLElement>('[data-sound]')
  if (tagged) return tagged.dataset.sound === 'none' ? null : (tagged.dataset.sound as SoundName)
  if (target.closest(QUIET)) return null
  const el = target.closest<HTMLElement>(INTERACTIVE)
  if (!el) return null
  if (el.matches('[role="switch"]')) return el.getAttribute('aria-checked') === 'true' ? 'toggleOff' : 'toggleOn'
  if (el.matches('[role="tab"], [aria-pressed]')) return 'tab'
  if (el.matches('label')) return 'select'
  // Links that open a page in the app (sidebar, cards, landing buttons) sound like moving on.
  if (el instanceof HTMLAnchorElement) return el.target === '_blank' || el.getAttribute('href')?.startsWith('#') ? 'click' : 'nav'
  return 'click'
}

/** Gives every button, tab, toggle, link and dropdown in the app its click sound. Call once at startup. */
export function installUiSounds() {
  // Capture phase: runs before React's handlers, so a toggle's sound reflects the state it's leaving.
  window.addEventListener(
    'click',
    (e) => {
      const sound = e.target instanceof Element ? soundForClick(e.target) : null
      if (sound) playSound(sound)
    },
    true,
  )
  window.addEventListener(
    'change',
    (e) => {
      if (e.target instanceof HTMLSelectElement) playSound('select')
    },
    true,
  )
}

/** Ticks through the last ten seconds of a running countdown (null = not running) and sounds the alarm as it hits zero. */
export function useCountdownSound(secondsLeft: number | null) {
  const previous = useRef(secondsLeft)
  useEffect(() => {
    const before = previous.current
    previous.current = secondsLeft
    // Only a clock seen counting down makes noise — not one that was already out when the page opened.
    if (secondsLeft === null || before === null || secondsLeft >= before) return
    if (secondsLeft === 0) playSound('timeUp')
    else if (secondsLeft <= 10) playSound('tick')
  }, [secondsLeft])
}
