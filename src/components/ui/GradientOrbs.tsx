import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface GradientOrbsProps {
  className?: string
  variant?: 'hero' | 'cta'
}

export function GradientOrbs({ className, variant = 'hero' }: GradientOrbsProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <motion.div
        className="absolute left-1/2 top-[-120px] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/15 blur-[110px]"
        animate={{ x: ['-52%', '-48%', '-52%'], y: [0, 24, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-120px] top-[140px] h-[380px] w-[380px] rounded-full bg-[var(--color-violet)]/15 blur-[100px]"
        animate={{ y: [0, -30, 0], x: [0, 14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      {variant === 'hero' && (
        <motion.div
          className="absolute left-[-100px] top-[360px] h-[300px] w-[300px] rounded-full bg-[var(--color-info)]/10 blur-[90px]"
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}
