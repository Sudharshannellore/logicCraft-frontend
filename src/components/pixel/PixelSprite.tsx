import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { basePalette, sprites, type Sprite, type SpriteName } from './sprites'
import { cn } from '@/utils/cn'

interface PixelSpriteProps {
  sprite: Sprite | SpriteName
  /** CSS pixels per art pixel. */
  scale?: number
  /** Frames per second; omit or 0 to stay on `frame`. */
  fps?: number
  frame?: number
  flip?: boolean
  className?: string
  /** Accessible name; decorative (aria-hidden) when omitted. */
  title?: string
}

type FramePaths = { ch: string; color: string; d: string }[]

function buildFramePaths(frame: string[], palette: Record<string, string>): FramePaths {
  const byColor = new Map<string, string[]>()
  frame.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let run = 1
      while (x + run < row.length && row[x + run] === ch) run++
      if (ch !== '.' && palette[ch]) {
        const parts = byColor.get(ch) ?? []
        parts.push(`M${x} ${y}h${run}v1h-${run}z`)
        byColor.set(ch, parts)
      }
      x += run
    }
  })
  return [...byColor.entries()].map(([ch, parts]) => ({ ch, color: palette[ch], d: parts.join('') }))
}

export function resolveSprite(sprite: Sprite | SpriteName): Sprite {
  return typeof sprite === 'string' ? sprites[sprite] : sprite
}

export function PixelSprite({ sprite, scale = 4, fps = 0, frame = 0, flip = false, className, title }: PixelSpriteProps) {
  const def = resolveSprite(sprite)
  const reduceMotion = useReducedMotion()
  const [tick, setTick] = useState(0)

  const frames = useMemo(() => {
    const palette = { ...basePalette, ...def.palette }
    return def.frames.map((f) => buildFramePaths(f, palette))
  }, [def])

  const animate = fps > 0 && frames.length > 1 && !reduceMotion

  useEffect(() => {
    if (!animate) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000 / fps)
    return () => window.clearInterval(id)
  }, [animate, fps])

  const current = animate ? (frame + tick) % frames.length : frame % frames.length
  const width = def.frames[0][0].length
  const height = def.frames[0].length

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      className={cn('shrink-0', className)}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {frames[current].map(({ ch, color, d }) => (
        <path key={ch} d={d} fill={color} />
      ))}
    </svg>
  )
}

/** Pre-rasterises each frame to an offscreen canvas at 1 art-pixel = 1 canvas pixel (for canvas scenes). */
export function rasterizeSprite(sprite: Sprite | SpriteName): HTMLCanvasElement[] {
  const def = resolveSprite(sprite)
  const palette = { ...basePalette, ...def.palette }
  return def.frames.map((frame) => {
    const canvas = document.createElement('canvas')
    canvas.width = frame[0].length
    canvas.height = frame.length
    const ctx = canvas.getContext('2d')!
    frame.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = palette[row[x]]
        if (row[x] === '.' || !color) continue
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    })
    return canvas
  })
}
