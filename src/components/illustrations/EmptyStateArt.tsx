import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

/** "Nothing here yet": the hero standing on a tiny patch of ground, puzzling over a compass. */
export function EmptyStateArt({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-end justify-center', className)} aria-hidden="true">
      <PixelSprite sprite="compass" scale={2} className="animate-pixel-hover absolute right-[18%] top-1" />
      <PixelSprite sprite="star" scale={1} fps={2} className="animate-pixel-twinkle absolute left-[16%] top-4" />
      <div className="flex flex-col items-center">
        <PixelSprite sprite="hero" scale={4} />
        <div className="h-1 w-24 bg-[var(--color-accent)]" />
        <div className="h-2 w-24 bg-[#3c8c18]" />
      </div>
    </div>
  )
}
