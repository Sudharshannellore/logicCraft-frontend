import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelWorld } from '@/components/pixel/PixelWorld'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  /** Under the card, e.g. "New here? Create an account". */
  footer: ReactNode
}

/** Sign-in and sign-up share this: the live pixel world behind a single pixel-framed card. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <PixelWorld className="fixed inset-0 opacity-60" hud={false} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,9,11,0.55)_0%,rgba(8,9,11,0.85)_70%)]" />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <PixelSprite sprite="questBot" scale={2} />
          <span className="font-pixel text-xl">Logicraft</span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md"
        >
          <section className="pixel-frame bg-[var(--color-surface)] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="pixel-corners flex h-14 w-14 shrink-0 items-end justify-center overflow-hidden bg-[var(--color-accent-soft)] pb-1">
                <PixelSprite sprite="hero" scale={3} className="animate-pixel-bob" />
              </div>
              <div>
                <h1 className="text-2xl leading-tight">{title}</h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
              </div>
            </div>
            {children}
          </section>
          <div className="mt-5 text-center text-sm text-[var(--color-text-secondary)]">{footer}</div>
        </motion.div>
      </main>
    </div>
  )
}
