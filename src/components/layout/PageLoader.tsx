import { PixelSprite } from '@/components/pixel/PixelSprite'

export function PageLoader() {
  return (
    <div className="flex h-[60dvh] flex-col items-center justify-center gap-3" role="status">
      <div className="flex flex-col items-center">
        <PixelSprite sprite="heroRun" scale={4} fps={8} className="animate-pixel-bob" />
        <div className="h-1 w-20 bg-[var(--color-accent)]" />
      </div>
      <p className="font-pixel text-sm tracking-widest text-[var(--color-text-secondary)]">
        LOADING<span className="animate-caret">_</span>
      </p>
    </div>
  )
}
