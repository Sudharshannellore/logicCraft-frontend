import { cn } from '@/utils/cn'

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <div
      className={cn(
        'pixel-corners flex h-11 w-11 flex-col items-center justify-center bg-[var(--color-accent)] leading-none text-[#06120a] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25),inset_3px_3px_0_rgba(255,255,255,0.3)]',
        className,
      )}
      aria-label={`Level ${level}`}
    >
      <span className="font-pixel text-[9px] uppercase">Lvl</span>
      <span className="font-pixel text-lg">{level}</span>
    </div>
  )
}
