import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { errorMessage } from '@/services/api/client'
import { useWalletStore } from '@/stores/walletStore'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

interface XpPurchaseButtonProps {
  children: ReactNode
  cost: number
  /** Performs the purchase on the server (which charges the XP); resolve false if it didn't go through. */
  onPurchase: () => Promise<boolean> | boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** A one-off XP purchase (not AI): shows the price, is disabled when unaffordable, flashes the charge. */
export function XpPurchaseButton({ children, cost, onPurchase, disabled, size = 'md', className }: XpPurchaseButtonProps) {
  const xp = useWalletStore((s) => s.xp)
  const [charged, setCharged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const short = cost - xp
  const cantAfford = short > 0

  const buy = async () => {
    setBusy(true)
    setError(null)
    try {
      if (!(await onPurchase())) return
      setCharged(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCharged(false), 1400)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className={cn('relative inline-flex flex-col', className)}>
      <button
        type="button"
        disabled={disabled || cantAfford || busy}
        title={cantAfford ? `Costs ${cost} XP — you're ${short} XP short. Earn more by learning and solving problems.` : `Costs ${cost} XP`}
        onClick={buy}
        className={cn(
          'inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-pixel text-[var(--color-accent)] transition-[background-color,transform] duration-100 hover:-translate-y-0.5 hover:bg-[var(--color-accent)] hover:text-[#06120a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[var(--color-accent-soft)] disabled:hover:text-[var(--color-accent)]',
          size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        )}
      >
        {children}
        <span className="inline-flex items-center gap-1 opacity-90">
          · <PixelSprite sprite="star" scale={1} /> {cost} XP
        </span>
      </button>
      {error && (
        <span role="alert" className="mt-1 text-[11px] text-[var(--color-error)]">
          {error}
        </span>
      )}
      <AnimatePresence>
        {charged && (
          <motion.span
            className="pointer-events-none absolute -top-5 right-0 font-pixel text-xs text-[var(--color-warning)]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -6 }}
            exit={{ opacity: 0 }}
          >
            −{cost} XP
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
