import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Info, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { XpBalance } from '@/components/economy/EconomyBits'
import { useQuery } from '@tanstack/react-query'
import type { Billing, XpPack, XpPlan } from '@/types'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { playSound } from '@/services/sound'
import { PageLoader } from '@/components/layout/PageLoader'
import { formatInr, useSubscriptionState, useSubscriptionStore } from '@/stores/subscriptionStore'
import { cn } from '@/utils/cn'

const spendList = [
  { label: 'Quest AI answer', cost: '10 XP', to: '/practice', sprite: 'questBot' },
  { label: 'Resume AI (summary, bullets, tailoring)', cost: '10–50 XP', to: '/resume', sprite: 'resume' },
  { label: 'Premium resume template', cost: '100–200 XP', to: '/resume', sprite: 'gem' },
  { label: 'Extra resume slot', cost: '100 XP', to: '/resume', sprite: 'chest' },
] as const

const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

type CheckoutItem =
  | { kind: 'plan'; plan: XpPlan; billing: Billing }
  | { kind: 'pack'; pack: XpPack }

function checkoutSummary(item: CheckoutItem) {
  if (item.kind === 'plan') {
    const { plan, billing } = item
    return {
      title: `${plan.name} plan · ${billing === 'yearly' ? 'Yearly' : 'Monthly'}`,
      price: plan.price[billing],
      period: billing === 'yearly' ? '/year' : '/month',
      xpNow: plan.monthlyXp,
      detail: `${plan.monthlyXp.toLocaleString()} XP now, then every month${billing === 'yearly' ? ' for 12 months' : ' until you cancel'}.`,
    }
  }
  return { title: `${item.pack.xp.toLocaleString()} XP pack`, price: item.pack.price, period: 'one-time', xpNow: item.pack.xp, detail: 'Added to your balance once. Never expires.' }
}

function CheckoutDialog({ item, onClose }: { item: CheckoutItem; onClose: () => void }) {
  const subscribe = useSubscriptionStore((s) => s.subscribe)
  const buyPack = useSubscriptionStore((s) => s.buyPack)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const summary = checkoutSummary(item)

  useEffect(() => {
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      if (item.kind === 'plan') await subscribe(item.plan.id, item.billing)
      else await buyPack(item.pack.id)
      setDone(true)
      playSound('purchase')
    } catch (e) {
      setError(errorMessage(e))
      playSound('error')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-md border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[6px_6px_0_var(--pixel-ink)] outline-none"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="relative flex flex-col items-center gap-3 overflow-hidden px-6 py-10 text-center">
            <Confetti fire count={32} />
            <PixelSprite sprite="chestOpened" scale={5} className="animate-pixel-bob" />
            <p className="font-pixel text-3xl text-[var(--color-accent)]">+{summary.xpNow.toLocaleString()} XP</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{item.kind === 'plan' ? `Welcome to ${item.plan.name}! Your next drop arrives in a month.` : 'Added to your balance.'}</p>
            <Button variant="pixel" className="mt-2" onClick={onClose}>
              Back to the store
            </Button>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl">Checkout</h2>
            <div className="mt-4 border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-pixel">{summary.title}</p>
                <p className="shrink-0 font-pixel text-lg">
                  {formatInr(summary.price)}
                  <span className="text-xs text-[var(--color-text-muted)]"> {summary.period}</span>
                </p>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{summary.detail}</p>
              <p className="mt-3 flex items-center gap-1.5 font-pixel text-sm text-[var(--color-accent)]">
                <PixelSprite sprite="star" scale={1.25} /> +{summary.xpNow.toLocaleString()} XP today
              </p>
            </div>
            <p className="mt-4 flex items-start gap-2 border-2 border-[var(--color-info)]/40 bg-[var(--color-info)]/10 p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-info)]" />
              Payments aren't connected yet, so purchases are paused. You can still earn XP by learning, practising and finishing quests.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="pixel" onClick={confirm} disabled={busy}>
                {busy ? 'Confirming…' : 'Confirm demo purchase'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}

function ActivePlan() {
  const subscription = useSubscriptionStore((s) => s.subscription)
  const cancel = useSubscriptionStore((s) => s.cancel)
  const resume = useSubscriptionStore((s) => s.resume)
  const { data: plans = [] } = useQuery({ queryKey: ['xp-plans'], queryFn: api.getPlans })
  const plan = subscription ? plans.find((p) => p.id === subscription.planId) : undefined
  if (!subscription || !plan) return null

  return (
    <section aria-label="Your plan" className="mb-8 flex flex-wrap items-center gap-4 border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 sm:p-5">
      <PixelSprite sprite={plan.sprite} scale={4} className="animate-pixel-hover" />
      <div className="min-w-0 flex-1">
        <p className="font-pixel text-lg">
          {plan.name} plan <span className="text-sm text-[var(--color-text-secondary)]">· {subscription.billing}</span>
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Next drop: <span className="font-pixel text-[var(--color-accent)]">+{plan.monthlyXp.toLocaleString()} XP</span> on {fmtDate(subscription.nextDropAt)}
          {' · '}
          {subscription.cancelAtPeriodEnd ? (
            <span className="text-[var(--color-warning)]">ends on {fmtDate(subscription.periodEndsAt)}</span>
          ) : (
            <>renews on {fmtDate(subscription.periodEndsAt)}</>
          )}
        </p>
      </div>
      {subscription.cancelAtPeriodEnd ? (
        <Button variant="pixel" size="sm" onClick={() => void resume()}>
          Keep my plan
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => void cancel()}>
          Cancel plan
        </Button>
      )}
    </section>
  )
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{sub}</p>
    </div>
  )
}

export default function Subscription() {
  const subscription = useSubscriptionStore((s) => s.subscription)
  const purchases = useSubscriptionStore((s) => s.purchases)
  const loaded = useSubscriptionState()
  const { data: xpPlans } = useQuery({ queryKey: ['xp-plans'], queryFn: api.getPlans })
  const { data: xpPacks } = useQuery({ queryKey: ['xp-packs'], queryFn: api.getPacks })
  const [billing, setBilling] = useState<Billing>('monthly')
  const [checkout, setCheckout] = useState<CheckoutItem | null>(null)

  if (!loaded || !xpPlans || !xpPacks) return <PageLoader />

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="pixel-corners flex h-16 w-16 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
          <PixelSprite sprite="crown" scale={4} className="animate-pixel-hover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl">Get XP</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Earn XP by learning and solving — or top up to use Quest AI, templates and job applications sooner.</p>
        </div>
        <XpBalance className="px-2 py-1.5 text-sm" />
      </header>

      <ActivePlan />

      <section aria-label="Monthly plans" className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle title="Monthly XP plans" sub="A fresh XP drop every month. Cancel anytime — XP you already have is yours to keep." />
          <div role="group" aria-label="Billing period" className="mb-4 flex border-2 border-[var(--color-border-strong)] p-0.5">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={billing === b}
                onClick={() => setBilling(b)}
                className={cn(
                  'px-3 py-1.5 font-pixel text-xs capitalize transition-colors',
                  billing === b ? 'bg-[var(--color-accent)] text-[#06120a]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                {b}
                {b === 'yearly' && <span className={cn('ml-1.5', billing === b ? '' : 'text-[var(--color-accent)]')}>2 months free</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {xpPlans.map((plan) => {
            const current = subscription?.planId === plan.id
            const price = plan.price[billing]
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col border-2 bg-[var(--color-surface)] p-5 shadow-[4px_4px_0_var(--pixel-ink)] sm:p-6',
                  plan.popular ? 'border-[var(--color-violet)]' : 'border-[var(--color-border-strong)]',
                  current && 'border-[var(--color-accent)]',
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-5 border-2 border-[var(--color-violet)] bg-[var(--color-violet)] px-2 py-0.5 font-pixel text-[11px] text-[#140b2e]">Most popular</span>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-pixel text-lg">{plan.name}</p>
                  <PixelSprite sprite={plan.sprite} scale={3} className={plan.popular ? 'animate-pixel-bob' : ''} />
                </div>
                <p className="mt-3 font-pixel text-3xl">
                  {formatInr(price)}
                  <span className="text-sm text-[var(--color-text-muted)]">{billing === 'yearly' ? ' /year' : ' /month'}</span>
                </p>
                <p className="mt-0.5 h-4 text-xs text-[var(--color-text-muted)]">{billing === 'yearly' && `≈ ${formatInr(Math.round(price / 12))} a month`}</p>
                <p className="mt-4 flex items-center gap-2 font-pixel text-xl text-[var(--color-accent)]">
                  <PixelSprite sprite="star" scale={2} /> {plan.monthlyXp.toLocaleString()} XP<span className="text-xs text-[var(--color-text-secondary)]">/month</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--color-text-secondary)]">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" /> {perk}
                    </li>
                  ))}
                </ul>
                {current ? (
                  <Button variant="outline" className="mt-6" disabled>
                    <Check className="h-4 w-4" /> Current plan
                  </Button>
                ) : (
                  <Button variant={plan.popular ? 'pixelViolet' : 'pixel'} className="mt-6" onClick={() => setCheckout({ kind: 'plan', plan, billing })}>
                    {subscription ? `Switch to ${plan.name}` : `Get ${plan.name}`}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section aria-label="XP packs" className="mb-10">
        <SectionTitle title="One-time XP packs" sub="No subscription — top up once. Bigger packs come with bonus XP." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {xpPacks.map((pack, i) => (
            <div key={pack.id} className="flex flex-col items-center border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 text-center shadow-[4px_4px_0_var(--pixel-ink)]">
              <div className="flex h-14 items-end justify-center gap-0.5">
                {Array.from({ length: i + 1 }, (_, k) => (
                  <PixelSprite key={k} sprite="star" scale={2 + i * 0.25} className={k % 2 ? 'animate-pixel-twinkle' : ''} />
                ))}
              </div>
              <p className="mt-3 font-pixel text-2xl text-[var(--color-accent)]">{pack.xp.toLocaleString()} XP</p>
              <div className="mt-1 h-6">{pack.bonusPercent > 0 && <Badge variant="violet">+{pack.bonusPercent}% bonus</Badge>}</div>
              <p className="mt-2 font-pixel text-lg">{formatInr(pack.price)}</p>
              <Button variant="pixelDark" size="sm" className="mt-4 w-full" onClick={() => setCheckout({ kind: 'pack', pack })}>
                Buy pack
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Where XP goes" className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 shadow-[4px_4px_0_var(--pixel-ink)]">
          <h2 className="mb-3 text-lg">Where your XP goes</h2>
          <ul className="divide-y-2 divide-[var(--color-border)]">
            {spendList.map((s) => (
              <li key={s.label}>
                <Link to={s.to} className="flex items-center gap-3 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                  <PixelSprite sprite={s.sprite} scale={1.5} />
                  <span className="flex-1">{s.label}</span>
                  <span className="font-pixel text-xs text-[var(--color-accent)]">{s.cost}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Bought XP can be spent anywhere, but it doesn't raise your level — levels are earned by learning and solving.</p>
        </section>

        <section aria-label="Purchase history" className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 shadow-[4px_4px_0_var(--pixel-ink)]">
          <h2 className="mb-3 text-lg">Purchase history</h2>
          {purchases.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <PixelSprite sprite="scroll" scale={3} />
              <p className="text-sm text-[var(--color-text-muted)]">No purchases yet.</p>
            </div>
          ) : (
            <ul className="pixel-scroll max-h-72 divide-y-2 divide-[var(--color-border)] overflow-y-auto pr-1">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[var(--color-text-primary)]">{p.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{fmtDate(p.at)}</p>
                  </div>
                  <span className="font-pixel text-xs text-[var(--color-accent)]">+{p.xp.toLocaleString()} XP</span>
                  <span className="w-16 text-right font-pixel text-xs text-[var(--color-text-secondary)]">{p.price ? formatInr(p.price) : 'Included'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {checkout && <CheckoutDialog item={checkout} onClose={() => setCheckout(null)} />}
    </div>
  )
}
