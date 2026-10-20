import { useQuery } from '@tanstack/react-query'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { isSpriteName } from '@/components/pixel/sprites'
import { api } from '@/services/api'

/** Live feed of players' wins (public — shown before signing in). */
export function ActivityTicker() {
  const { data: activity = [] } = useQuery({ queryKey: ['activity'], queryFn: () => api.getActivity(12), refetchInterval: 30_000 })
  if (activity.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2.5 border-y-2 border-[var(--pixel-ink)] bg-[var(--color-surface)] py-3 font-pixel text-sm text-[var(--color-text-secondary)]">
        <PixelSprite sprite="trophy" scale={2} /> No wins yet — solve a problem and yours will be the first one here.
      </div>
    )
  }
  const items = [...activity, ...activity]

  return (
    <div className="relative overflow-hidden border-y-2 border-[var(--pixel-ink)] bg-[var(--color-surface)] py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--color-surface)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--color-surface)] to-transparent" />
      <p className="sr-only">Recent activity from Logicraft players</p>
      <ul className="animate-ticker flex w-max items-center gap-10" aria-hidden="true">
        {items.map((e, i) => (
          <li key={`${e.id}-${i}`} className="flex items-center gap-2.5 whitespace-nowrap font-pixel text-sm">
            <PixelSprite sprite={isSpriteName(e.sprite) ? e.sprite : 'star'} scale={2} />
            <span className="text-[var(--color-text-primary)]">{e.player}</span>
            <span className="text-[var(--color-text-secondary)]">{e.action}</span>
            <span className="text-[var(--color-accent)]">+{e.xp} XP</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
