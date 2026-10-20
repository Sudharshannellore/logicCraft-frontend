import { useMemo } from 'react'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { gem, recolor } from '@/components/pixel/sprites'
import type { LeagueInfo } from '@/types'
import { cn } from '@/utils/cn'

const leagueColors: Record<LeagueInfo['tier'], { light: string; dark: string }> = {
  bronze: { light: '#e0a26e', dark: '#8a5a2e' },
  silver: { light: '#d3dae2', dark: '#7c8794' },
  gold: { light: '#ffd23f', dark: '#c98a00' },
  platinum: { light: '#a9ece3', dark: '#4fa79b' },
  diamond: { light: '#6dc9f5', dark: '#2a8bb8' },
  master: { light: '#a78bfa', dark: '#6d28d9' },
}

export function LeagueBadge({ league, className }: { league: LeagueInfo; className?: string }) {
  const { light, dark } = leagueColors[league.tier]
  const tierGem = useMemo(
    () => ({ frames: gem.frames.map((f) => recolor(f, { C: 'L', c: 'l' })), palette: { L: light, l: dark } }),
    [light, dark],
  )

  return (
    <div
      className={cn('flex items-center gap-2 border-2 px-3 py-1.5 shadow-[3px_3px_0_var(--pixel-ink)]', className)}
      style={{ borderColor: `${light}66`, backgroundColor: `${light}14` }}
    >
      <PixelSprite sprite={tierGem} scale={2} />
      <span className="font-pixel text-sm" style={{ color: light }}>
        {league.label}
      </span>
    </div>
  )
}
