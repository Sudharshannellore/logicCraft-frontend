import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { rasterizeSprite } from './PixelSprite'
import { drawPixelText } from './pixelFont'
import { cn } from '@/utils/cn'

export type BackdropScene = 'dungeon' | 'vault'

interface PixelBackdropProps {
  scene: BackdropScene
  className?: string
}

const FPS = 20

function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string }
type SceneState = { time: number; particles: Particle[]; streams: { x: number; y: number; speed: number; len: number }[] }

/* ---------------- Dungeon (Practice) ---------------- */

function renderDungeonWall(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#08090d'
  ctx.fillRect(0, 0, w, h)
  const BW = 14
  const BH = 6
  const shades = ['#141824', '#161b28', '#121620', '#181d2b']
  for (let row = 0; row * BH < h; row++) {
    const offset = row % 2 ? BW / 2 : 0
    for (let col = -1; col * BW < w + BW; col++) {
      const x = col * BW + offset
      const y = row * BH
      const r = hash(col, row)
      ctx.fillStyle = shades[Math.floor(r * shades.length)]
      ctx.fillRect(x + 1, y + 1, BW - 1, BH - 1)
      ctx.fillStyle = '#1e2434'
      ctx.fillRect(x + 1, y + 1, BW - 2, 1)
      ctx.fillStyle = '#0e1119'
      ctx.fillRect(x + 1, y + BH - 1, BW - 1, 1)
      if (r > 0.86) {
        ctx.fillStyle = '#1b3320'
        ctx.fillRect(x + 2 + Math.floor(r * 8), y + 1, 3, 1)
        ctx.fillRect(x + 3 + Math.floor(r * 8), y + 2, 1, 1)
      } else if (r < 0.07) {
        ctx.fillStyle = '#0a0c12'
        ctx.fillRect(x + 5, y + 2, 1, 1)
        ctx.fillRect(x + 6, y + 3, 1, 1)
        ctx.fillRect(x + 7, y + 3, 1, 1)
      }
    }
  }
  // Floor tiles
  const floorY = h - 12
  for (let x = 0; x < w; x++) {
    for (let y = floorY; y < h; y++) {
      const tile = (Math.floor(x / 8) + Math.floor((y - floorY) / 6)) % 2
      ctx.fillStyle = y === floorY ? '#262c3d' : tile ? '#10131b' : '#0c0f16'
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return c
}

// Torches hug the side gutters so page content never hides them.
function torchPositions(w: number, h: number) {
  const left = 7
  const right = w - 7
  const rows = h > 160 ? [0.16, 0.74] : [0.16]
  return rows.flatMap((r) => [left, right].map((x) => ({ x, y: Math.round(h * r) })))
}

/* ---------------- Data vault (SQL) ---------------- */

function renderVault(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#060a12'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#0b1322'
  for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 1, h)
  for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 1)
  // Server racks on both edges
  const rackW = 22
  for (const rx of [2, w - rackW - 2]) {
    ctx.fillStyle = '#0f1726'
    ctx.fillRect(rx, 6, rackW, h - 12)
    ctx.fillStyle = '#1c2a44'
    ctx.fillRect(rx, 6, rackW, 1)
    ctx.fillRect(rx, h - 7, rackW, 1)
    ctx.fillRect(rx, 6, 1, h - 12)
    ctx.fillRect(rx + rackW - 1, 6, 1, h - 12)
    for (let y = 10; y < h - 12; y += 6) {
      ctx.fillStyle = '#152036'
      ctx.fillRect(rx + 2, y, rackW - 4, 4)
      ctx.fillStyle = '#0a101c'
      ctx.fillRect(rx + 4, y + 1, 9, 1)
      ctx.fillRect(rx + 4, y + 2, 9, 1)
    }
  }
  return c
}

const LED_COLORS = ['#3dd68c', '#4da3ff', '#f5a623', '#3dd68c']

/* ---------------- Component ---------------- */

export function PixelBackdrop({ scene, className }: PixelBackdropProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')!
    const flameFrames = rasterizeSprite('flame')

    let W = 0
    let H = 0
    let base: HTMLCanvasElement | null = null
    const state: SceneState = { time: 0, particles: [], streams: [] }

    function resize() {
      const rect = wrap!.getBoundingClientRect()
      const scale = rect.width < 768 ? 3 : 4
      W = Math.max(48, Math.ceil(rect.width / scale))
      H = Math.max(48, Math.ceil(rect.height / scale))
      canvas!.width = W
      canvas!.height = H
      canvas!.style.width = `${W * scale}px`
      canvas!.style.height = `${H * scale}px`
      base = scene === 'dungeon' ? renderDungeonWall(W, H) : renderVault(W, H)
      if (scene === 'vault') {
        state.streams = []
        for (let x = 28; x < W - 28; x += 6) {
          if (hash(x, 3) < 0.45) continue
          state.streams.push({ x, y: hash(x, 9) * H, speed: 10 + hash(x, 5) * 22, len: 4 + Math.floor(hash(x, 7) * 7) })
        }
      }
      draw()
    }

    function update(dt: number) {
      state.time += dt
      if (scene === 'dungeon') {
        for (const t of torchPositions(W, H)) {
          if (Math.random() < dt * 9) {
            state.particles.push({
              x: t.x + (Math.random() * 4 - 2),
              y: t.y - 6,
              vx: Math.random() * 6 - 3,
              vy: -(8 + Math.random() * 10),
              life: 1.2 + Math.random(),
              color: Math.random() < 0.5 ? '#f5a623' : '#ffd23f',
            })
          }
        }
        if (Math.random() < dt * 2) {
          state.particles.push({ x: -2, y: Math.random() * H * 0.8, vx: 3 + Math.random() * 3, vy: Math.random() - 0.5, life: 12, color: '#2a3042' })
        }
      } else {
        for (const s of state.streams) {
          s.y += s.speed * dt
          if (s.y - s.len * 6 > H) s.y = -Math.random() * 40
        }
      }
      for (const p of state.particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt
      }
      state.particles = state.particles.filter((p) => p.life > 0 && p.x < W + 4 && p.y > -4)
    }

    function drawGlow(x: number, y: number, radius: number, color: string, alpha: number) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
      g.addColorStop(0, color.replace('ALPHA', String(alpha)))
      g.addColorStop(1, color.replace('ALPHA', '0'))
      ctx.fillStyle = g
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }

    function draw() {
      if (!base) return
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(base, 0, 0)

      if (scene === 'dungeon') {
        const frame = Math.floor(state.time * 6)
        torchPositions(W, H).forEach((t, i) => {
          const flicker = 0.16 + Math.sin(state.time * 9 + i * 2) * 0.03 + (hash(frame, i) - 0.5) * 0.04
          drawGlow(t.x, t.y - 4, 38, 'rgba(245,166,35,ALPHA)', flicker)
          ctx.fillStyle = '#3a404c'
          ctx.fillRect(t.x - 2, t.y + 2, 5, 2)
          ctx.fillStyle = '#5e3a17'
          ctx.fillRect(t.x - 1, t.y, 3, 8)
          ctx.drawImage(flameFrames[(frame + i) % flameFrames.length], t.x - 5, t.y - 12)
        })
      } else {
        for (const s of state.streams) {
          for (let k = 0; k < s.len; k++) {
            const gy = Math.round(s.y - k * 6)
            if (gy < -6 || gy > H) continue
            const glyph = hash(s.x, Math.floor(gy / 6) + Math.floor(state.time * 2)) > 0.5 ? '1' : '0'
            const color = k === 0 ? '#9ee6ff' : k < 3 ? '#2a8bb8' : '#123049'
            drawPixelText(ctx, glyph, s.x, gy, color)
          }
        }
        const tick = Math.floor(state.time * 4)
        for (const rx of [2, W - 24]) {
          for (let y = 10, n = 0; y < H - 12; y += 6, n++) {
            for (let l = 0; l < 3; l++) {
              const on = hash(n * 3 + l + rx, tick) > 0.45
              ctx.fillStyle = on ? LED_COLORS[(n + l) % LED_COLORS.length] : '#1a2438'
              ctx.fillRect(rx + 15 + l * 2, y + 1, 1, 1)
            }
          }
        }
        const scanY = Math.round(((state.time * 18) % (H + 30)) - 15)
        ctx.fillStyle = 'rgba(109,201,245,0.07)'
        ctx.fillRect(0, scanY, W, 6)
        ctx.fillStyle = 'rgba(109,201,245,0.16)'
        ctx.fillRect(0, scanY + 6, W, 1)
      }

      for (const p of state.particles) {
        ctx.globalAlpha = Math.min(1, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
      }
      ctx.globalAlpha = 1

      const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)
    }

    resize()
    if (reduceMotion) {
      for (let i = 0; i < 60; i++) update(1 / 20)
      draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    let raf = 0
    let last = performance.now()
    let acc = 0
    let visible = true
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000))
      last = now
      acc += dt
      if (acc >= 1 / FPS) {
        update(acc)
        draw()
        acc = 0
      }
      if (visible) raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !reduceMotion) {
        last = performance.now()
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(loop)
      }
    })
    io.observe(wrap)
    if (!reduceMotion) raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [scene, reduceMotion])

  return (
    <div ref={wrapRef} aria-hidden="true" className={cn('pointer-events-none fixed inset-x-0 bottom-0 top-[var(--topbar-h,4rem)] z-0 overflow-hidden transition-[left] duration-200 ease-out lg:left-[var(--sidebar-w,0px)]', className)}>
      <canvas ref={canvasRef} className="pixelated block" />
    </div>
  )
}
