import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

interface QuestAIAvatarProps {
  size?: number
  animated?: boolean
  className?: string
}

/** Logicraft's mascot: Quest AI as a pixel bot, used anywhere the mentor speaks. */
export function QuestAIAvatar({ size = 32, animated = false, className }: QuestAIAvatarProps) {
  return (
    <PixelSprite
      sprite="questBot"
      scale={size / 16}
      fps={animated ? 4 : 0}
      className={cn(animated && 'animate-pixel-hover', className)}
    />
  )
}
