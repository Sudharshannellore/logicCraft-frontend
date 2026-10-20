import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

/** The Recursion Boss as a pixel sprite; sized by `className` like any block element. */
export function BossSilhouette({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pixel-hover', className)}>
      <PixelSprite sprite="recursionBoss" fps={3} className="h-full w-full" />
    </div>
  )
}
