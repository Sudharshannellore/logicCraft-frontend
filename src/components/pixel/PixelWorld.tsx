import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { rasterizeSprite } from './PixelSprite'
import { drawPixelText, pixelTextWidth } from './pixelFont'
import { cn } from '@/utils/cn'

interface PixelWorldProps {
  className?: string
  /** Show the XP counter + hearts strip in the ground. */
  hud?: boolean
  /** Tap/click makes the hero jump. */
  interactive?: boolean
}

const GROUND_H = 16
const SPEED = 30 // art px per second
// Tuned so the hero's feet stay above a bug for its whole 24px overlap window at SPEED.
const GRAVITY = 260
const JUMP_V = -130

const SKY_TOP = [8, 9, 11]
const SKY_BOTTOM = [26, 17, 48]
const BAYER = [
  [0, 0.5],
  [0.75, 0.25],
]

type Star = { x: number; y: number; phase: number; bright: boolean }
type Coin = { x: number; y: number; taken: boolean }
type Bug = { x: number }
type Popup = { x: number; y: number; life: number }
type Glyph = { x: number; y: number; text: string; speed: number }

/** Deterministic PRNG so the landscape is identical on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Periodic stepped ridge line; tiles seamlessly because every term has an integer frequency over `length`. */
function ridge(length: number, base: number, amp: number, seed: number) {
  const rand = mulberry32(seed)
  const waves = [1, 2, 5].map((k, i) => ({ k, a: amp / (i + 1), p: rand() * Math.PI * 2 }))
  const heights: number[] = []
  for (let x = 0; x < length; x++) {
    const sx = x - (x % 3)
    let h = base
    for (const w of waves) h += w.a * Math.sin((2 * Math.PI * w.k * sx) / length + w.p)
    heights.push(Math.round(h / 2) * 2)
  }
  return heights
}

function renderLayer(width: number, height: number, heights: number[], body: string, edge: string) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')!
  for (let x = 0; x < width; x++) {
    const top = height - heights[x % heights.length]
    ctx.fillStyle = body
    ctx.fillRect(x, top, 1, height - top)
    ctx.fillStyle = edge
    ctx.fillRect(x, top, 1, 1)
  }
  return c
}

function renderSky(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const steps = 7
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const band = Math.min(steps, Math.floor((y / h) * steps + BAYER[y % 2][x % 2])) / steps
      const i = (y * w + x) * 4
      for (let k = 0; k < 3; k++) img.data[i + k] = Math.round(SKY_TOP[k] + (SKY_BOTTOM[k] - SKY_TOP[k]) * band)
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  // Moon with craters
  // On narrow screens the headline fills the sky, so tuck the moon into the corner.
  const narrow = w < 200
  const mx = narrow ? w - 14 : Math.round(w * 0.84)
  const my = narrow ? 16 : Math.round(h * 0.2)
  const r = 9
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue
      const lit = x * x + y * y < (r - 1) * (r - 1)
      ctx.fillStyle = lit ? '#e8e2ff' : '#b9adf0'
      ctx.fillRect(mx + x, my + y, 1, 1)
    }
  }
  ctx.fillStyle = '#c9bff5'
  for (const [cx, cy, s] of [
    [-3, -2, 2],
    [2, 2, 3],
    [3, -4, 1],
    [-4, 4, 1],
  ]) {
    ctx.fillRect(mx + cx, my + cy, s, s)
  }
  return c
}

export function PixelWorld({ className, hud = true, interactive = false }: PixelWorldProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const jumpRequest = useRef(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')!

    const heroRun = rasterizeSprite('heroRun')
    const starFrames = rasterizeSprite('star')
    const bugFrames = rasterizeSprite('bugSlime')
    const heartFrame = rasterizeSprite('heart')[0]

    let W = 0
    let H = 0
    let scale = 4
    let sky: HTMLCanvasElement | null = null
    let far: HTMLCanvasElement | null = null
    let near: HTMLCanvasElement | null = null
    let stars: Star[] = []
    let glyphs: Glyph[] = []

    const rand = mulberry32(7)
    const state = {
      time: 0,
      scroll: 0,
      heroY: 0,
      heroVy: 0,
      score: 1240,
      coins: [] as Coin[],
      bugs: [] as Bug[],
      popups: [] as Popup[],
      nextCoin: 0.6,
      nextBug: 2.5,
    }

    const groundY = () => H - GROUND_H
    const heroX = () => Math.round(W * (W < 220 ? 0.12 : 0.2))

    function resize() {
      const rect = wrap!.getBoundingClientRect()
      scale = rect.width < 768 ? 3 : 4
      W = Math.max(64, Math.ceil(rect.width / scale))
      H = Math.max(48, Math.ceil(rect.height / scale))
      canvas!.width = W
      canvas!.height = H
      canvas!.style.width = `${W * scale}px`
      canvas!.style.height = `${H * scale}px`

      sky = renderSky(W, H)
      const tile = 384
      far = renderLayer(tile, H, ridge(tile, H * 0.32, H * 0.14, 3), '#17132b', '#2b2452')
      near = renderLayer(tile, H, ridge(tile, GROUND_H + H * 0.12, H * 0.06, 11), '#0f2117', '#1f4a2b')

      const starRand = mulberry32(42)
      stars = Array.from({ length: Math.round((W * H) / 140) }, () => ({
        x: Math.floor(starRand() * W),
        y: Math.floor(starRand() * H * 0.62),
        phase: starRand() * Math.PI * 2,
        bright: starRand() > 0.82,
      }))
      const glyphRand = mulberry32(99)
      const texts = ['{ }', '</>', '=>', '( )', ';', '0101']
      glyphs = Array.from({ length: Math.max(3, Math.round(W / 70)) }, (_, i) => ({
        x: glyphRand() * W,
        y: 6 + Math.floor(glyphRand() * H * 0.45),
        text: texts[i % texts.length],
        speed: 2 + glyphRand() * 3,
      }))
      state.heroY = groundY() - 16
      draw()
    }

    function spawn(dt: number) {
      state.nextCoin -= dt
      state.nextBug -= dt
      if (state.nextCoin <= 0) {
        const lift = rand() < 0.4 ? 22 : 12 + Math.floor(rand() * 6)
        const count = rand() < 0.35 ? 3 : 1
        for (let i = 0; i < count; i++) state.coins.push({ x: W + 4 + i * 11, y: groundY() - lift - 8, taken: false })
        state.nextCoin = 0.9 + rand() * 1.1
      }
      if (state.nextBug <= 0) {
        state.bugs.push({ x: W + 8 })
        state.nextBug = 3.2 + rand() * 3
      }
    }

    function update(dt: number) {
      state.time += dt
      state.scroll += SPEED * dt
      spawn(dt)

      const hx = heroX()
      const floor = groundY() - 16
      const onGround = state.heroY >= floor
      const bugAhead = state.bugs.some((b) => b.x - hx > 6 && b.x - hx < 17.5)
      const highCoinAhead = state.coins.some((c) => c.y < groundY() - 24 && c.x - hx > 12 && c.x - hx < 16)
      if (onGround && (bugAhead || highCoinAhead || jumpRequest.current)) state.heroVy = JUMP_V
      jumpRequest.current = false
      state.heroVy += GRAVITY * dt
      state.heroY = Math.min(floor, state.heroY + state.heroVy * dt)
      if (state.heroY >= floor) state.heroVy = 0

      for (const c of state.coins) {
        c.x -= SPEED * dt
        const hit = !c.taken && c.x < hx + 13 && c.x + 8 > hx + 3 && c.y < state.heroY + 16 && c.y + 8 > state.heroY
        if (hit) {
          c.taken = true
          state.score += 10
          state.popups.push({ x: c.x, y: c.y, life: 0.9 })
        }
      }
      for (const b of state.bugs) b.x -= SPEED * dt
      for (const p of state.popups) {
        p.life -= dt
        p.y -= 14 * dt
      }
      for (const g of glyphs) {
        g.x -= g.speed * dt
        if (g.x < -20) g.x = W + rand() * 40
      }
      state.coins = state.coins.filter((c) => c.x > -12 && !c.taken)
      state.bugs = state.bugs.filter((b) => b.x > -16)
      state.popups = state.popups.filter((p) => p.life > 0)
    }

    function drawTiled(layer: HTMLCanvasElement, speed: number) {
      const offset = Math.floor((state.scroll * speed) % layer.width)
      for (let x = -offset; x < W; x += layer.width) ctx.drawImage(layer, x, 0)
    }

    function draw() {
      if (!sky || !far || !near) return
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(sky, 0, 0)

      for (const s of stars) {
        const on = Math.sin(state.time * 2.2 + s.phase) > -0.35
        if (!on) continue
        ctx.fillStyle = s.bright ? '#ffffff' : '#7d84a3'
        ctx.fillRect(s.x, s.y, 1, 1)
        if (s.bright && Math.sin(state.time * 3 + s.phase) > 0.6) {
          ctx.fillStyle = '#a78bfa'
          ctx.fillRect(s.x - 1, s.y, 1, 1)
          ctx.fillRect(s.x + 1, s.y, 1, 1)
          ctx.fillRect(s.x, s.y - 1, 1, 1)
          ctx.fillRect(s.x, s.y + 1, 1, 1)
        }
      }
      for (const g of glyphs) drawPixelText(ctx, g.text, g.x, g.y, '#262b3d')

      drawTiled(far, 0.18)
      drawTiled(near, 0.45)

      // Ground: grass lip + dirt with a scrolling speckle pattern
      const gy = groundY()
      const offset = Math.floor(state.scroll)
      ctx.fillStyle = '#16110d'
      ctx.fillRect(0, gy, W, GROUND_H)
      for (let x = 0; x < W; x++) {
        const wx = x + offset
        ctx.fillStyle = wx % 7 === 0 ? '#b6ff8a' : '#7bf542'
        ctx.fillRect(x, gy, 1, 1)
        ctx.fillStyle = (wx >> 1) % 3 === 0 ? '#3c8c18' : '#2c6a12'
        ctx.fillRect(x, gy + 1, 1, 1)
        if ((wx * 7) % 11 === 0) ctx.fillRect(x, gy + 2, 1, 1)
        if ((wx * 13) % 17 === 0) {
          ctx.fillStyle = '#2a1f17'
          ctx.fillRect(x, gy + 5 + ((wx * 3) % 8), 2, 1)
        }
      }

      const twinkle = Math.floor(state.time * 3)
      for (const c of state.coins) ctx.drawImage(starFrames[twinkle % starFrames.length], Math.round(c.x), Math.round(c.y))
      for (const b of state.bugs) ctx.drawImage(bugFrames[Math.floor(state.time * 4) % 2], Math.round(b.x), gy - 9)

      const airborne = state.heroY < groundY() - 16
      const heroFrame = airborne ? heroRun[0] : heroRun[Math.floor(state.time * 8) % heroRun.length]
      ctx.drawImage(heroFrame, heroX(), Math.round(state.heroY))

      for (const p of state.popups) {
        const color = p.life > 0.25 || Math.floor(p.life * 20) % 2 === 0 ? '#ffd23f' : '#c98a00'
        drawPixelText(ctx, '+10', p.x - 1, p.y, color)
        drawPixelText(ctx, 'XP', p.x + pixelTextWidth('+10') + 2, p.y, '#7bf542')
      }

      if (hud) {
        const label = `XP ${String(state.score).padStart(6, '0')}`
        drawPixelText(ctx, label, 4, gy + 7, '#7bf542')
        for (let i = 0; i < 3; i++) ctx.drawImage(heartFrame, W - 4 - (i + 1) * 11, gy + 5)
      }
    }

    resize()
    if (reduceMotion) {
      // Pre-simulate a few seconds so the single static frame has coins and bugs in it.
      for (let i = 0; i < 200; i++) update(1 / 60)
      draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    let raf = 0
    let last = performance.now()
    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !reduceMotion) {
        last = performance.now()
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(loop)
      }
    })
    io.observe(wrap)

    function loop(now: number) {
      // rAF timestamps can predate the performance.now() taken at setup, so clamp below at 0.
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      update(dt)
      draw()
      if (visible) raf = requestAnimationFrame(loop)
    }

    if (!reduceMotion) raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [hud, reduceMotion])

  return (
    <div
      ref={wrapRef}
      className={cn('overflow-hidden', className)}
      aria-hidden="true"
      onPointerDown={interactive ? () => (jumpRequest.current = true) : undefined}
    >
      <canvas ref={canvasRef} className="pixelated block" />
    </div>
  )
}
