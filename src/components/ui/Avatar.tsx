import { useMemo } from 'react'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { tintedHero } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

interface AvatarProps {
  initials: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const box = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-20 w-20' }
const scale = { sm: 2, md: 3, lg: 5 }

/** A pixel character in the player's colour, framed like a game portrait. */
export function Avatar({ initials, color, size = 'md', className }: AvatarProps) {
  const sprite = useMemo(() => tintedHero(color), [color])
  return (
    <div
      role="img"
      aria-label={`Avatar for ${initials}`}
      className={cn('relative flex shrink-0 items-end justify-center overflow-hidden border-2', box[size], className)}
      style={{ borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 16%, var(--color-surface))` }}
    >
      <PixelSprite sprite={sprite} scale={scale[size]} className="translate-y-[12%]" />
    </div>
  )
}
