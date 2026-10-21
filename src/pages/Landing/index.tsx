import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { CountUp } from '@/components/ui/CountUp'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelWorld } from '@/components/pixel/PixelWorld'
import type { SpriteName } from '@/components/pixel/sprites'
import { ActivityTicker } from '@/components/landing/ActivityTicker'
import { TreasureCTA } from '@/components/landing/TreasureCTA'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'


const features: { sprite: SpriteName; title: string; description: string; tint: string }[] = [
  {
    sprite: 'book',
    title: 'Learn Programming',
    description: 'Structured, game-like learning paths take you from fundamentals to advanced concepts, one node at a time.',
    tint: 'var(--color-accent)',
  },
  {
    sprite: 'terminal',
    title: 'Practice Real Code',
    description: 'Hundreds of hand-crafted problems with instant execution, test feedback, and difficulty-tiered XP.',
    tint: 'var(--color-info)',
  },
  {
    sprite: 'questBot',
    title: 'AI Code Coach',
    description: 'Quest AI reviews your solutions, explains failures, and nudges you toward better patterns — never just the answer.',
    tint: 'var(--color-violet)',
  },
  {
    sprite: 'database',
    title: 'SQL Playground',
    description: 'Query an interactive database, inspect schemas, and get AI feedback on query efficiency.',
    tint: 'var(--color-info)',
  },
  {
    sprite: 'flame',
    title: 'Gamified Progress',
    description: 'XP, levels, streaks, and achievements turn every session into forward motion you can see.',
    tint: 'var(--color-warning)',
  },
  {
    sprite: 'trophy',
    title: 'Compete & Climb',
    description: 'Leagues, leaderboards, and timed Boss Battles pit your skills against developers worldwide.',
    tint: 'var(--color-warning)',
  },
  {
    sprite: 'compass',
    title: 'Personalized Learning',
    description: 'Recommendations adapt to your weak spots — the platform studies you as much as you study it.',
    tint: 'var(--color-accent)',
  },
]

const steps: { sprite: SpriteName; title: string; text: string }[] = [
  { sprite: 'book', title: 'Learn a concept', text: 'Open-source lessons loaded live, each with a graded exercise.' },
  { sprite: 'sword', title: 'Practice it', text: 'Solve real problems in Monaco with instant tests and AI review.' },
  { sprite: 'trophy', title: 'Compete with it', text: 'Climb leagues, beat Boss Battles, and track XP against friends.' },
]

const floatingChips: { sprite: SpriteName; text: string; color: string; className: string }[] = [
  { sprite: 'star', text: '+100 XP', color: 'var(--color-accent)', className: '-left-4 -top-6' },
  { sprite: 'flame', text: '12 day streak', color: 'var(--color-warning)', className: '-right-6 top-10 [animation-delay:0.5s]' },
  { sprite: 'star', text: 'Level up!', color: 'var(--color-violet)', className: '-bottom-5 right-10 [animation-delay:1s]' },
]

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 font-pixel text-sm uppercase tracking-widest text-[var(--color-accent)]">
      {'> '}
      {children}
      <span className="animate-caret">_</span>
    </p>
  )
}

export default function Landing() {
  const { data: platform } = useQuery({ queryKey: ['platform-stats'], queryFn: api.getStats, staleTime: 60_000 })
  // Live counts from the server — nothing here is made up.
  const stats: { sprite: SpriteName; value: number; label: string }[] = platform
    ? [
        { sprite: 'hero', value: platform.learners, label: platform.learners === 1 ? 'Learner' : 'Learners' },
        { sprite: 'terminal', value: platform.problemsSolved, label: 'Problems solved' },
        { sprite: 'recursionBoss', value: platform.bossesDefeated, label: 'Bosses defeated' },
        { sprite: 'gem', value: platform.languages, label: 'Languages to learn' },
      ]
    : []
  const signedIn = useAuthStore((s) => !!s.accessToken)
  // Signed-out visitors start by creating an account; signed-in players go straight to their dashboard.
  const start = signedIn ? '/dashboard' : '/signup'
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <PixelSprite sprite="questBot" scale={2} />
            <span className="font-pixel text-xl">Logicraft</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--color-text-secondary)] md:flex">
            <a href="#features" className="hover:text-[var(--color-text-primary)]">Features</a>
            <a href="#how-it-works" className="hover:text-[var(--color-text-primary)]">How it works</a>
            <Link to="/leaderboard" className="hover:text-[var(--color-text-primary)]">Leaderboard</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to={signedIn ? '/dashboard' : '/signin'} className="hidden text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] sm:block">
              {signedIn ? 'Dashboard' : 'Sign in'}
            </Link>
            <Link to={start} className={buttonVariants({ variant: 'pixel', size: 'sm' })}>
              {signedIn ? 'Continue' : 'Start Coding'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero: a live pixel world runs behind the headline */}
      {/* Fills the screen under the nav so the running game along the bottom is always in view. */}
      <section className="relative flex min-h-[calc(100svh-4rem-1px)] flex-col overflow-hidden">
        <PixelWorld className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[var(--color-bg)] to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-12 h-[420px] w-[min(900px,100%)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(8,9,11,0.85)_0%,rgba(8,9,11,0.55)_45%,transparent_72%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 pb-48 pt-10 text-center [@media(max-height:760px)]:pb-40 [@media(max-height:760px)]:pt-6 [@media(max-height:700px)]:pb-32!">
          <Badge variant="accent" className="mb-7 rounded-none [@media(max-height:760px)]:mb-4 [@media(max-height:700px)]:mb-3! border-2 border-[var(--color-accent)]/40 py-1.5 font-pixel text-sm">
            <PixelSprite sprite="questBot" scale={1} fps={4} />
            AI coding mentor built in
          </Badge>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl font-sans text-4xl font-extrabold tracking-tight sm:text-6xl [@media(max-height:760px)]:sm:text-5xl"
          >
            Learn to Code. Play. Compete.{' '}
            <span className="mt-2 block font-pixel text-5xl text-[var(--color-accent)] [text-shadow:4px_4px_0_var(--color-violet-strong)] sm:text-7xl [@media(max-height:760px)]:sm:text-6xl">
              Level Up.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-7 max-w-xl text-base text-[var(--color-text-secondary)] sm:text-lg [@media(max-height:760px)]:mt-4 [@media(max-height:700px)]:mt-3!"
          >
            An AI-powered coding playground where you learn programming, solve real problems, improve your
            code, and compete with developers around the world.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row [@media(max-height:760px)]:mt-6 [@media(max-height:700px)]:mt-5! [@media(max-height:700px)]:gap-3!"
          >
            <Link to={start} className={cn(buttonVariants({ variant: 'pixel', size: 'lg' }), 'group text-lg')}>
              Start Coding
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/challenges" className={cn(buttonVariants({ variant: 'pixelDark', size: 'lg' }), 'text-lg')}>
              Explore Challenges
            </Link>
          </motion.div>
        </div>
      </section>

      <ActivityTicker />

      {/* Product preview */}
      <section className="mx-auto max-w-5xl px-6 pt-20">
        <ScrollReveal className="relative">
          {floatingChips.map((chip) => (
            <div
              key={chip.text}
              className={cn(
                'animate-pixel-hover absolute z-10 hidden items-center gap-2 border-2 bg-[var(--color-surface)] px-3 py-1.5 shadow-[4px_4px_0_var(--pixel-ink)] sm:flex',
                chip.className,
              )}
              style={{ borderColor: chip.color }}
            >
              <PixelSprite sprite={chip.sprite} scale={2} fps={chip.sprite === 'star' ? 2 : 3} />
              <span className="font-pixel text-sm" style={{ color: chip.color }}>
                {chip.text}
              </span>
            </div>
          ))}
          <div className="pixel-frame overflow-hidden bg-[var(--color-surface)]">
            <div className="flex items-center gap-1.5 border-b-2 border-[var(--pixel-ink)] px-4 py-3">
              <span className="h-3 w-3 bg-[var(--color-error)]" />
              <span className="h-3 w-3 bg-[var(--color-warning)]" />
              <span className="h-3 w-3 bg-[var(--color-success)]" />
              <span className="ml-3 font-mono text-xs text-[var(--color-text-muted)]">two-sum.py — Logicraft</span>
            </div>
            <div className="grid grid-cols-1 gap-px bg-[var(--color-border)] md:grid-cols-[1fr_1.2fr]">
              <div className="space-y-4 bg-[var(--color-surface)] p-6 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Two Sum</h3>
                  <Badge variant="success">Easy · +100 XP</Badge>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Given an array of integers <code className="font-mono text-[var(--color-text-primary)]">nums</code> and an
                  integer <code className="font-mono text-[var(--color-text-primary)]">target</code>, return the indices of
                  the two numbers that add up to target.
                </p>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-xs text-[var(--color-text-secondary)]">
                  Input: nums = [2,7,11,15], target = 9<br />
                  Output: [0,1]
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[var(--color-success)]">
                    <Check className="h-4 w-4" /> Test 1 passed
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-success)]">
                    <Check className="h-4 w-4" /> Test 2 passed
                  </div>
                </div>
              </div>
              <div className="bg-[#0b0c0f] p-6 text-left font-mono text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                <div><span className="text-[var(--color-violet)]">def</span> <span className="text-[var(--color-info)]">two_sum</span>(nums, target):</div>
                <div className="pl-4">seen = {'{}'}</div>
                <div className="pl-4"><span className="text-[var(--color-violet)]">for</span> i, n <span className="text-[var(--color-violet)]">in</span> enumerate(nums):</div>
                <div className="pl-8">complement = target - n</div>
                <div className="pl-8"><span className="text-[var(--color-violet)]">if</span> complement <span className="text-[var(--color-violet)]">in</span> seen:</div>
                <div className="pl-12"><span className="text-[var(--color-violet)]">return</span> [seen[complement], i]</div>
                <div className="pl-8">seen[n] = i</div>
                <div className="mt-4 flex items-start gap-3 border-2 border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-3 text-[var(--color-text-primary)]">
                  <QuestAIAvatar size={32} />
                  <p>
                    <span className="font-pixel text-[var(--color-accent)]">Quest AI: </span>
                    Clean O(n) solution. Consider renaming <code>n</code> to <code>num</code> for clarity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Stats */}
      <section className="mx-auto mt-20 max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 0.08}>
              <div className="flex h-full flex-col items-center border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center">
                <div className="mb-3 flex h-14 items-end">
                  <PixelSprite sprite={s.sprite} scale={s.sprite === 'recursionBoss' ? 2 : 3} fps={2} />
                </div>
                <p className="font-pixel text-2xl text-[var(--color-accent)] sm:text-3xl">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <ScrollReveal className="mb-14 text-center">
          <SectionLabel>features</SectionLabel>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to go from learner to competitor</h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-secondary)]">
            Seven systems working together, not seven disconnected tools.
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i % 4) * 0.06} className={cn(i === 0 && 'lg:col-span-2')}>
              <div className="group h-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-[border-color,transform] duration-150 hover:-translate-y-1 hover:border-[var(--color-border-strong)]">
                <div
                  className="pixel-corners mb-5 flex h-16 w-16 items-center justify-center"
                  style={{ backgroundColor: `color-mix(in srgb, ${f.tint} 14%, transparent)` }}
                >
                  <PixelSprite
                    sprite={f.sprite}
                    scale={3}
                    fps={f.sprite === 'questBot' || f.sprite === 'flame' || f.sprite === 'terminal' ? 3 : 0}
                    className="group-hover:animate-pixel-bob"
                  />
                </div>
                <h3 className="font-pixel text-lg">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{f.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Meet Quest AI */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <ScrollReveal>
            <SectionLabel>your mentor</SectionLabel>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Meet <span className="font-pixel text-[var(--color-violet)]">Quest AI.</span>
            </h2>
            <p className="mt-4 max-w-md text-[var(--color-text-secondary)]">
              Not a chat window bolted onto the side — Quest AI lives inside every lesson, every problem, and every
              failed test, reading your actual code and explaining exactly where your thinking went sideways.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {['Explains failures instead of just flagging them', 'Reviews complexity and code quality on every submit', 'Adapts hints to the concept you are actually stuck on'].map(
                (item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[var(--color-text-secondary)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="pixel-frame bg-[var(--color-surface)] p-6 shadow-[0_0_0_2px_var(--color-violet),6px_6px_0_var(--color-violet-strong)]">
              <div className="flex items-center gap-4">
                <QuestAIAvatar size={64} animated />
                <div>
                  <p className="font-pixel text-xl">Quest AI</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Reviewing your submission<span className="animate-caret">_</span>
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] p-3 text-sm text-[var(--color-text-secondary)]">
                  You're close. You understand how the loop works, but you're mixing up the condition that moves
                  the search boundary.
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Give me a hint', 'Show an example', 'Why is this wrong?'].map((a) => (
                    <span key={a} className="border-2 border-[var(--color-border-strong)] px-3 py-1 font-pixel text-xs text-[var(--color-text-secondary)]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="pixel-scanlines border-y-2 border-[var(--pixel-ink)] bg-[var(--color-surface)]/50">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <ScrollReveal className="mb-14 text-center">
            <SectionLabel>how it works</SectionLabel>
            <h2 className="text-3xl font-bold tracking-tight">Built like a game. Priced like a classroom.</h2>
          </ScrollReveal>
          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {steps.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 0.12}>
                <li className="flex flex-col items-center text-center">
                  <div className="mb-5 flex h-24 items-end">
                    <PixelSprite sprite={s.sprite} scale={6} className="animate-pixel-hover" />
                  </div>
                  <p className="font-pixel text-sm text-[var(--color-accent)]">LEVEL 0{i + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{s.text}</p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <TreasureCTA />

      <footer className="border-t-2 border-[var(--pixel-ink)] px-6 py-8 text-center font-pixel text-sm text-[var(--color-text-muted)]">
        © {new Date().getFullYear()} Logicraft · Press START to level up
      </footer>
    </div>
  )
}
