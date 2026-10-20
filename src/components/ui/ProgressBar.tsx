import { PixelBar } from '@/components/pixel/PixelBar'

interface ProgressBarProps {
  percent: number
  className?: string
  trackClassName?: string
  color?: 'accent' | 'violet' | 'info'
  size?: 'sm' | 'md' | 'lg'
  segments?: number
}

/** Kept as the app-wide progress API; renders the segmented pixel bar. */
export function ProgressBar({ percent, className, trackClassName, color = 'accent', size = 'md', segments = 16 }: ProgressBarProps) {
  return <PixelBar percent={percent} color={color} size={size} segments={segments} className={[trackClassName, className].filter(Boolean).join(' ')} />
}
