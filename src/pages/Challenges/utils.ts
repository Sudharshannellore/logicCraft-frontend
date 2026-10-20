import { useEffect, useState } from 'react'
import { isSpriteName, type SpriteName } from '@/components/pixel/sprites'
import type { ChallengeKind, LiveChallenge } from '@/types'

export const KIND_META: Record<ChallengeKind, { label: string; sprite: SpriteName; color: string }> = {
  daily: { label: 'Daily Challenge', sprite: 'star', color: 'var(--color-accent)' },
  speed: { label: 'Speed Round', sprite: 'lightning', color: 'var(--color-info)' },
  boss: { label: 'Weekly Boss', sprite: 'recursionBoss', color: 'var(--color-violet)' },
  zone: { label: 'Zone Boss', sprite: 'slime', color: 'var(--color-error)' },
}

export function bossSprite(challenge: LiveChallenge): SpriteName {
  return challenge.bossSprite && isSpriteName(challenge.bossSprite) ? challenge.bossSprite : KIND_META[challenge.kind].sprite
}

/** The current time, refreshed every `intervalMs`. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/** "5h 12m", "12m", "45s". */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m`
  return `${total}s`
}

export const challengeHref = (challenge: LiveChallenge) =>
  challenge.kind === 'zone' ? `/learn/${challenge.courseId}/boss/${challenge.bossId}` : `/challenges/${challenge.id}`

/** Seconds left on my clock, or null when it isn't running. */
export function secondsLeft(challenge: LiveChallenge, now: number) {
  if (challenge.me.status !== 'in_progress' || challenge.me.deadline == null) return null
  return Math.max(0, Math.ceil((challenge.me.deadline - now) / 1000))
}
