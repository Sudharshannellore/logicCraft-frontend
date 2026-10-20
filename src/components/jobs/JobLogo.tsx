import type { JobLogoArt } from '@/types'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { isSpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

const sizes = { sm: { box: 'h-10 w-10', scale: 2 }, md: { box: 'h-12 w-12', scale: 2.5 }, lg: { box: 'h-16 w-16', scale: 3.5 } }

/** Company "logo": a pixel sprite on a tile in the company's colour (board logos are their trademarks). */
export function JobLogo({ logo, size = 'md', className }: { logo: JobLogoArt; size?: keyof typeof sizes; className?: string }) {
  const { box, scale } = sizes[size]
  return (
    <div
      className={cn('pixel-corners flex shrink-0 items-center justify-center', box, className)}
      style={{
        background: `color-mix(in srgb, ${logo.color} 16%, var(--color-bg))`,
        boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${logo.color} 45%, transparent)`,
      }}
    >
      <PixelSprite sprite={isSpriteName(logo.sprite) ? logo.sprite : 'briefcase'} scale={scale} />
    </div>
  )
}
