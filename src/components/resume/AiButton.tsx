import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { errorMessage } from '@/services/api/client'
import { playSound } from '@/services/sound'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

interface AiButtonProps {
  label: string
  cost: number
  /** Calls the Quest AI endpoint (which charges the XP) and applies its result. */
  onRun: () => Promise<unknown> | void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** A paid AI action: shows its price, "thinks" while the server works, then flashes the charge. */
export function AiButton({ label, cost, onRun, disabled, size = 'md', className }: AiButtonProps) {
  const xp = useWalletStore((s) => s.xp)
  const [thinking, setThinking] = useState(false)
  const [charged, setCharged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const mounted = useRef(true)

  useEffect(
    () => () => {
      mounted.current = false
      window.clearTimeout(timer.current)
    },
    [],
  )

  const short = cost - xp
  const cantAfford = short > 0

  const run = async () => {
    if (thinking || disabled) return
    setThinking(true)
    setError(null)
    try {
      await onRun()
      playSound('magic')
      if (!mounted.current) return
      setCharged(true)
      timer.current = window.setTimeout(() => setCharged(false), 1400)
    } catch (e) {
      playSound('error')
      if (mounted.current) setError(errorMessage(e))
    } finally {
      if (mounted.current) setThinking(false)
    }
  }

  return (
    <span className={cn('relative inline-flex flex-col items-end', className)}>
      <button
        type="button"
        onClick={run}
        disabled={disabled || cantAfford || thinking}
        title={cantAfford ? `Needs ${cost} XP — you're ${short} XP short. Earn more by learning and solving problems.` : `Costs ${cost} XP`}
        className={cn(
          'inline-flex items-center gap-1.5 border-2 border-[var(--color-violet)] bg-[var(--color-violet-soft)] font-pixel text-[var(--color-violet)] transition-[background-color,transform] duration-100 hover:-translate-y-0.5 hover:bg-[var(--color-violet)] hover:text-[#140b2e] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[var(--color-violet-soft)] disabled:hover:text-[var(--color-violet)]',
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1.5 text-xs',
        )}
      >
        <Sparkles className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', thinking && 'animate-spin')} />
        {thinking ? 'Thinking…' : label}
        {!thinking && <span className="opacity-80">· {cost} XP</span>}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-[260px] text-right text-[11px] text-[var(--color-error)]">
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
