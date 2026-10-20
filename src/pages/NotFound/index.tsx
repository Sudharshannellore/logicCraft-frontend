import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/Button'
import { PixelWorld } from '@/components/pixel/PixelWorld'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pt-16 text-center">
        <p className="font-pixel text-7xl text-[var(--color-accent)] [text-shadow:5px_5px_0_var(--color-violet-strong)] sm:text-8xl">404</p>
        <h1 className="font-pixel text-2xl">This level hasn't been unlocked yet</h1>
        <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
          The route you're looking for doesn't exist. Tap the world below to jump, or head back to your quest.
        </p>
        <Link to="/dashboard" className={buttonVariants({ variant: 'pixel', size: 'lg' })}>
          Return to Base
        </Link>
      </div>
      <PixelWorld interactive className="mt-10 h-56 w-full cursor-pointer sm:h-64" />
    </div>
  )
}
