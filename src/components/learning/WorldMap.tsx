import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Difficulty, PathBoss, PathNode, PathZone } from '@/types'
import { PixelSprite, resolveSprite } from '@/components/pixel/PixelSprite'
import { PixelBar } from '@/components/pixel/PixelBar'
import { isSpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

type Dir = 'left' | 'right' | 'up' | 'down'

interface WorldMapProps {
  zones: PathZone[]
  /** Where an unlocked topic leads (the lesson player). */
  lessonHref: (node: PathNode) => string
  /** Where an unlocked boss leads (its fight). */
  bossHref: (boss: PathBoss) => string
  className?: string
}

// Trail segments are pinned to the tile's vertical centre: 28px top padding + half of the 76px tile.
const TRAIL_Y = 66
const BOSS_TILE = 96

export const TIERS: Record<Difficulty, { label: string; color: string; sprite: 'potion' | 'sword' | 'flame' }> = {
  easy: { label: 'Beginner', color: 'var(--color-success)', sprite: 'potion' },
  medium: { label: 'Intermediate', color: 'var(--color-warning)', sprite: 'sword' },
  hard: { label: 'Advanced', color: 'var(--color-error)', sprite: 'flame' },
}

function columnsFor(width: number) {
  if (width >= 960) return 4
  if (width >= 680) return 3
  if (width >= 440) return 2
  return 1
}

/** Snake layout: even rows run left→right, odd rows right→left, so consecutive stops are always neighbours. */
function position(index: number, cols: number) {
  const row = Math.floor(index / cols)
  const pos = index % cols
  return { row, col: row % 2 === 0 ? pos : cols - 1 - pos }
}

function direction(from: number, to: number, cols: number): Dir {
  const a = position(from, cols)
  const b = position(to, cols)
  if (a.row === b.row) return b.col > a.col ? 'right' : 'left'
  return b.row > a.row ? 'down' : 'up'
}

function TrailHalf({ dir, travelled, color }: { dir: Dir; travelled: boolean; color: string }) {
  const c = travelled ? color : 'var(--color-border-strong)'
  const horizontal = dir === 'left' || dir === 'right'
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute',
        horizontal ? 'h-1.5' : 'w-1.5 -translate-x-1/2',
        dir === 'right' && 'left-1/2 right-0',
        dir === 'left' && 'left-0 right-1/2',
        dir === 'down' && 'bottom-0 left-1/2',
        dir === 'up' && 'left-1/2 top-0',
      )}
      style={{
        top: horizontal ? TRAIL_Y - 3 : dir === 'down' ? TRAIL_Y : undefined,
        height: dir === 'up' ? TRAIL_Y : undefined,
        backgroundImage: `repeating-linear-gradient(${horizontal ? '90deg' : '180deg'}, ${c} 0 6px, transparent 6px 11px)`,
      }}
    />
  )
}

function StopTile({ node, href }: { node: PathNode; href: string }) {
  const done = node.state === 'completed'
  const current = node.state === 'current'
  const locked = node.state === 'locked'

  const tile = (
    <div
      className={cn(
        'pixel-corners relative flex h-[76px] w-[76px] items-center justify-center transition-transform duration-100',
        // Opaque fills so the trail passes behind the tile rather than showing through it.
        done && 'bg-[color-mix(in_srgb,var(--color-accent)_16%,var(--color-surface))] shadow-[inset_0_-5px_0_rgba(0,0,0,0.3)] group-hover:-translate-y-1',
        current && 'bg-[color-mix(in_srgb,var(--color-accent)_32%,var(--color-surface))] shadow-[inset_0_-5px_0_rgba(0,0,0,0.3)] group-hover:-translate-y-1',
        locked && 'bg-[var(--color-surface-elevated)]',
      )}
    >
      {done && <PixelSprite sprite="star" scale={4} fps={2} />}
      {current && <PixelSprite sprite="hero" scale={3.5} className="animate-pixel-bob" />}
      {locked && <PixelSprite sprite="lock" scale={3.5} className="opacity-50 grayscale" />}
    </div>
  )

  // Solid plate behind the text so vertical trail segments run behind the label instead of through it.
  const label: ReactNode = (
    <div className="mt-3 bg-[var(--color-surface)] px-2 py-1">
      <p className={cn('line-clamp-2 font-pixel text-sm leading-5', current ? 'text-[var(--color-accent)]' : locked ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]')}>
        {node.title}
      </p>
      <div className={cn('mt-1 flex items-center justify-center gap-2', locked && 'opacity-60')}>
        <span className="flex items-center gap-1 font-pixel text-[11px] text-[var(--color-warning)]">
          <PixelSprite sprite="star" scale={1} />+{node.xpReward}
        </span>
        <span className="font-pixel text-[11px] text-[var(--color-text-muted)]">{node.estimatedMinutes}m</span>
      </div>
    </div>
  )

  const tag = current ? (
    <span className="absolute left-1/2 top-1 z-20 -translate-x-1/2 whitespace-nowrap bg-[var(--color-accent)] px-1.5 font-pixel text-[10px] text-[#06120a] shadow-[2px_2px_0_var(--pixel-ink)]">
      YOU ARE HERE
    </span>
  ) : null

  if (locked) {
    return (
      <div className="relative z-10 flex flex-col items-center" aria-label={`${node.title} — locked`} title="Clear the stops before this one to unlock it">
        {tile}
        {label}
      </div>
    )
  }

  return (
    <Link
      to={href}
      aria-label={`${node.title} — ${done ? 'completed, review lesson' : 'current lesson, continue'}`}
      className="group relative z-10 flex flex-col items-center outline-none focus-visible:[&>div:first-of-type]:ring-2 focus-visible:[&>div:first-of-type]:ring-[var(--color-accent)]"
    >
      {tag}
      {tile}
      {label}
    </Link>
  )
}

function BossTile({ boss, href, isFinal }: { boss: PathBoss; href: string; isFinal: boolean }) {
  const defeated = boss.state === 'completed'
  const ready = boss.state === 'current'
  const locked = boss.state === 'locked'
  const sprite = isSpriteName(boss.sprite) ? boss.sprite : 'slime'
  const scale = Math.min(4, 64 / resolveSprite(sprite).frames[0][0].length)

  const tile = (
    <div
      className={cn(
        'pixel-corners relative flex items-center justify-center transition-transform duration-100',
        ready && 'bg-[radial-gradient(circle,#5c1420_0%,#2a0a10_75%)] shadow-[inset_0_-6px_0_rgba(0,0,0,0.35)] group-hover:-translate-y-1',
        defeated && 'bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--color-surface))] group-hover:-translate-y-1',
        locked && 'bg-[radial-gradient(circle,#4a2229_0%,#24100f_80%)]',
      )}
      style={{ width: BOSS_TILE, height: BOSS_TILE }}
    >
      {ready && <span aria-hidden className="absolute inset-0 animate-pulse bg-[var(--color-error)]/15" />}
      <PixelSprite
        sprite={sprite}
        scale={scale}
        fps={ready ? 4 : 0}
        className={cn(ready && 'animate-pixel-hover', defeated && 'opacity-50 grayscale', locked && 'opacity-70 brightness-0')}
      />
      {defeated && (
        <span className="absolute bottom-1.5 right-1.5">
          <PixelSprite sprite="star" scale={2} />
        </span>
      )}
      {locked && <span className="absolute font-pixel text-3xl text-[var(--color-error)]/70">?</span>}
    </div>
  )

  const tag = (
    <span
      className={cn(
        'absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap px-1.5 font-pixel text-[10px] shadow-[2px_2px_0_var(--pixel-ink)]',
        defeated ? 'bg-[var(--color-warning)] text-[#1a1200]' : 'bg-[var(--color-error)] text-white',
        ready && 'animate-pixel-bob',
      )}
    >
      {defeated ? 'DEFEATED' : ready ? 'FIGHT!' : isFinal ? 'FINAL BOSS' : 'BOSS'}
    </span>
  )

  const label = (
    <div className="mt-3 max-w-[220px] bg-[var(--color-surface)] px-2 py-1">
      <p className={cn('font-pixel text-sm leading-5', locked ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-error)]', defeated && 'text-[var(--color-warning)]')}>{boss.name}</p>
      <div className={cn('mt-1 flex items-center justify-center gap-0.5', defeated && 'opacity-40')} aria-label={`${boss.stages} rounds`}>
        {Array.from({ length: boss.stages }, (_, i) => (
          <PixelSprite key={i} sprite="heart" scale={1} />
        ))}
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--color-text-secondary)]">{boss.challenge}</p>
      <p className="mt-1 flex items-center justify-center gap-1 font-pixel text-[11px] text-[var(--color-warning)]">
        <PixelSprite sprite="star" scale={1} />+{boss.xpReward} XP
      </p>
    </div>
  )

  if (locked) {
    return (
      <div className="relative z-10 flex flex-col items-center" aria-label={`Boss ${boss.name} — locked`} title="Clear every topic in this zone to face the boss">
        {tag}
        {tile}
        {label}
      </div>
    )
  }

  return (
    <Link
      to={href}
      aria-label={`Boss ${boss.name} — ${defeated ? 'defeated' : 'ready, start the fight'}`}
      className="group relative z-10 flex flex-col items-center outline-none focus-visible:[&>div:nth-of-type(1)]:ring-2"
    >
      {tag}
      {tile}
      {label}
    </Link>
  )
}

function zoneStatus(zone: PathZone) {
  if (zone.boss.state === 'completed') return 'cleared'
  if (zone.boss.state === 'current' || zone.nodes.some((n) => n.state !== 'locked')) return 'active'
  return 'locked'
}

function Zone({ zone, index, prev, isLast, cols, lessonHref, bossHref }: { zone: PathZone; index: number; prev?: PathZone; isLast: boolean; cols: number; lessonHref: (node: PathNode) => string; bossHref: (boss: PathBoss) => string }) {
  const tier = TIERS[zone.difficulty]
  const status = zoneStatus(zone)
  const cleared = zone.nodes.filter((n) => n.state === 'completed').length
  // The boss is the last stop on the zone's trail.
  const stops = [...zone.nodes.map((n) => ({ kind: 'topic' as const, node: n, open: n.state !== 'locked' })), { kind: 'boss' as const, boss: zone.boss, open: zone.boss.state !== 'locked' }]

  return (
    <section
      aria-label={`Zone ${index + 1}: ${zone.name}`}
      className={cn('border-2 bg-[var(--color-surface)]', status === 'locked' ? 'border-[var(--color-border)]' : 'border-[var(--color-border-strong)]')}
      style={{ boxShadow: status === 'active' ? `0 0 0 1px ${tier.color}, 4px 4px 0 var(--pixel-ink)` : '4px 4px 0 var(--pixel-ink)' }}
    >
      <header
        className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b-2 border-[var(--color-border)] px-4 py-3 sm:px-5"
        style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${tier.color} 14%, transparent), transparent 70%)` }}
      >
        <div className="pixel-corners flex h-12 w-12 shrink-0 items-center justify-center" style={{ background: `color-mix(in srgb, ${tier.color} 22%, var(--color-bg))` }}>
          <PixelSprite sprite={status === 'locked' ? 'lock' : tier.sprite} scale={3} className={status === 'locked' ? 'opacity-60' : ''} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-pixel text-[11px] uppercase tracking-[0.2em]" style={{ color: tier.color }}>
            Zone {index + 1} · {tier.label}
            {status === 'cleared' && <span className="bg-[var(--color-warning)] px-1.5 tracking-normal text-[#1a1200]">CLEARED</span>}
          </p>
          <h3 className={cn('text-lg leading-tight sm:text-xl', status === 'locked' && 'text-[var(--color-text-secondary)]')}>{zone.name}</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">{zone.tagline}</p>
        </div>
        <div className="w-full sm:w-52">
          {status === 'locked' && prev ? (
            <p className="flex items-center gap-1.5 font-pixel text-xs text-[var(--color-text-muted)] sm:justify-end">
              <PixelSprite sprite="lock" scale={1} /> Defeat {prev.boss.name} to enter
            </p>
          ) : (
            <>
              <div className="mb-1 flex justify-between font-pixel text-[11px] text-[var(--color-text-secondary)]">
                <span>
                  {cleared}/{zone.nodes.length} topics
                </span>
                <span>{zone.boss.state === 'completed' ? 'Boss down' : 'Boss ahead'}</span>
              </div>
              <PixelBar
                percent={((cleared + (zone.boss.state === 'completed' ? 1 : 0)) / (zone.nodes.length + 1)) * 100}
                segments={zone.nodes.length + 1}
                size="sm"
                color={status === 'cleared' ? 'warning' : 'accent'}
                label={`${zone.name} progress`}
              />
            </>
          )}
        </div>
      </header>

      <div
        className={cn('grid bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] px-2 py-2 [background-size:18px_18px] sm:px-4', status === 'locked' && 'opacity-80')}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {stops.map((stop, i) => {
          const { row, col } = position(i, cols)
          const outDir = i < stops.length - 1 ? direction(i, i + 1, cols) : null
          const inDir = i > 0 ? direction(i, i - 1, cols) : null
          const isBoss = stop.kind === 'boss'
          return (
            <div
              key={isBoss ? stop.boss.id : stop.node.id}
              className="relative px-2 pb-8 text-center"
              style={{ gridRow: row + 1, gridColumn: col + 1, paddingTop: isBoss ? TRAIL_Y - BOSS_TILE / 2 : 28 }}
            >
              {inDir && <TrailHalf dir={inDir} travelled={stop.open} color={isBoss ? 'var(--color-error)' : 'var(--color-accent)'} />}
              {outDir && <TrailHalf dir={outDir} travelled={stops[i + 1].open} color={stops[i + 1].kind === 'boss' ? 'var(--color-error)' : 'var(--color-accent)'} />}
              {isBoss ? <BossTile boss={stop.boss} href={bossHref(stop.boss)} isFinal={isLast} /> : <StopTile node={stop.node} href={lessonHref(stop.node)} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** A course's world map: difficulty zones (Beginner → Advanced), each a winding trail of topics ending in a boss level. */
export function WorldMap({ zones, lessonHref, bossHref, className }: WorldMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(4)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setCols(columnsFor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn('space-y-3', className)}>
      {zones.map((zone, i) => (
        <div key={zone.id}>
          {i > 0 && (
            <div className="flex flex-col items-center py-1" aria-hidden="true">
              <span
                className="h-6 w-1.5"
                style={{
                  backgroundImage: `repeating-linear-gradient(180deg, ${zoneStatus(zone) === 'locked' ? 'var(--color-border-strong)' : 'var(--color-accent)'} 0 6px, transparent 6px 11px)`,
                }}
              />
              <span className="font-pixel text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                {zoneStatus(zone) === 'locked' ? 'Gate locked' : 'Gate open'}
              </span>
            </div>
          )}
          <Zone zone={zone} index={i} prev={zones[i - 1]} isLast={i === zones.length - 1} cols={cols} lessonHref={lessonHref} bossHref={bossHref} />
        </div>
      ))}
    </div>
  )
}
