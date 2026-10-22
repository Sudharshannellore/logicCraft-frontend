import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Play, Send, Swords, X } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { playSound, useCountdownSound } from '@/services/sound'
import type { AIMessage, Language, SubmissionResult } from '@/types'
import { ProblemPanel } from '@/components/coding/ProblemPanel'
import { CodeEditor } from '@/components/coding/CodeEditor'
import { CodeConsole, type ConsoleTab } from '@/components/coding/CodeConsole'
import { ResizeHandle } from '@/components/coding/ResizeHandle'
import { AICoach } from '@/components/ai/AICoach'
import { PageLoader } from '@/components/layout/PageLoader'
import { Badge, difficultyVariant } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { VictoryOverlay } from '@/components/gamification/VictoryOverlay'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelBackdrop } from '@/components/pixel/PixelBackdrop'
import { useWalletStore } from '@/stores/walletStore'
import { DUEL_WIN_BONUS, formatDuration, useFindPlayer, useSocialStore, type Duel } from '@/stores/socialStore'
import { cn } from '@/utils/cn'

export default function CodeWorkspace() {
  const { problemId } = useParams<{ problemId?: string }>()
  const slug = problemId ?? 'two-sum'

  const { data: problem, isLoading } = useQuery({ queryKey: ['problem', slug], queryFn: () => api.getProblem(slug) })
  const { data: mentorIntro } = useQuery({ queryKey: ['mentor-intro'], queryFn: api.getMentorIntro })
  const reduceMotion = useReducedMotion()

  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('testcases')
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [aiOpen, setAiOpen] = useState(false)
  const [needsHelp, setNeedsHelp] = useState(false)
  const [victoryOpen, setVictoryOpen] = useState(false)
  const [awardedXp, setAwardedXp] = useState(0)
  const setBalance = useWalletStore((s) => s.setBalance)
  const queryClient = useQueryClient()
  const [shaking, setShaking] = useState(false)
  const [leftWidth, setLeftWidth] = useState(40)
  const [editorHeight, setEditorHeight] = useState(60)
  // When this board was opened — the solve time recorded on the profile.
  const [openedAt] = useState(() => Date.now())
  const { data: suggestions = [] } = useQuery({
    queryKey: ['mentor-suggestions', 'problem', slug],
    queryFn: () => api.getMentorSuggestions({ kind: 'problem', ref: slug }),
  })

  const bodyRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  // Friend duel mode (/practice/:slug?duel=<id>): my clock starts when the board opens.
  const [searchParams] = useSearchParams()
  const duelId = searchParams.get('duel')
  const duel = useSocialStore((s) => (duelId ? s.duels.find((d) => d.id === duelId) : undefined))
  const socialLoaded = useSocialStore((s) => s.loaded)
  const refreshSocial = useSocialStore((s) => s.refresh)
  const startDuel = useSocialStore((s) => s.startDuel)
  const forfeitDuel = useSocialStore((s) => s.forfeitDuel)
  const upsertDuel = useSocialStore((s) => s.upsertDuel)
  const findPlayer = useFindPlayer()
  const [duelResult, setDuelResult] = useState<Duel | undefined>()
  const [now, setNow] = useState(() => Date.now())
  const duelLive = !!duel && duel.status === 'active' && duel.problemSlug === slug && duel.mySeconds === undefined
  const rival = duel ? (duel.friend ?? findPlayer(duel.friendId)) : undefined
  const remaining = duel ? duel.timeLimitMinutes * 60 - (duel.startedAt ? Math.max(0, Math.floor((now - duel.startedAt) / 1000)) : 0) : 0

  // Opened straight from a link: load the duel.
  useEffect(() => {
    if (duelId && !socialLoaded) void refreshSocial().catch(() => undefined)
  }, [duelId, socialLoaded, refreshSocial])

  useEffect(() => {
    if (duelLive && !duel.startedAt) void startDuel(duel.id).catch(() => undefined)
  }, [duelLive, duel, startDuel])

  useEffect(() => {
    if (!duelLive) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [duelLive])

  useEffect(() => {
    if (duelLive && duel.startedAt && remaining <= 0) {
      void forfeitDuel(duel.id)
        .then((result) => {
          setDuelResult(result)
          playSound('defeat')
        })
        .catch(() => undefined)
    }
  }, [duelLive, duel, remaining, forfeitDuel])

  useCountdownSound(duelLive && duel.startedAt ? Math.max(0, remaining) : null)

  useEffect(() => {
    if (problem) setCode(problem.starterCode[language])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, language])

  useEffect(() => {
    if (mentorIntro) setMessages(mentorIntro)
  }, [mentorIntro])

  useEffect(() => {
    if (!aiOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAiOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiOpen])

  if (isLoading || mentorIntro === undefined) return <PageLoader />

  if (!problem) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <PixelSprite sprite="bugSlime" scale={5} fps={3} className="animate-pixel-bob" />
        <h1 className="text-xl font-bold">Problem not found</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          We couldn't find a problem matching "{slug}". It may have been moved or doesn't exist yet.
        </p>
        <Link to="/practice" className={cn(buttonVariants({ variant: 'primary' }))}>
          Back to Practice
        </Link>
      </div>
    )
  }

  const handleLanguageChange = (next: Language) => {
    setLanguage(next)
    setResult(null)
    setSubmitted(false)
    setConsoleTab('testcases')
  }

  const runSubmission = async (submit: boolean) => {
    if (isRunning) return
    playSound(submit ? 'submit' : 'run')
    setIsRunning(true)
    setSubmitted(submit)
    setConsoleTab('results')
    let response: SubmissionResult
    try {
      response = submit
        ? await api.submitCode(problem.slug, {
            language,
            code,
            elapsedSeconds: Math.round((Date.now() - openedAt) / 1000),
            duelId: duelLive ? duel.id : undefined,
          })
        : await api.runCode(problem.slug, language, code)
    } catch (e) {
      response = { status: 'error', testResults: [], error: errorMessage(e) }
    }
    setResult(response)
    setIsRunning(false)
    setBalance(response.balance)
    if (submit && response.status !== 'error') setConsoleTab('review')
    if (submit && response.status === 'passed') {
      setAwardedXp(response.awardedXp ?? 0)
      if (response.duel) setDuelResult(upsertDuel(response.duel))
      void queryClient.invalidateQueries({ queryKey: ['problems'] })
      void queryClient.invalidateQueries({ queryKey: ['daily-quest'] })
      setVictoryOpen(true)
    }
    // A passing submit gets the victory fanfare from the overlay.
    if (response.status === 'error') playSound('error')
    else if (response.status === 'failed') playSound('fail')
    else if (!submit) playSound('success')
    if (response.status === 'failed') {
      setNeedsHelp(true)
      setShaking(true)
      window.setTimeout(() => setShaking(false), 450)
    }
  }

  const handleReset = () => {
    setCode(problem.starterCode[language])
    setResult(null)
    setSubmitted(false)
    setConsoleTab('testcases')
  }

  const handleAsk = async (question: string) => {
    const turn = messages.filter((m) => m.role === 'user').length
    const pendingId = `u-${Date.now()}`
    setMessages((prev) => [...prev, { id: pendingId, role: 'user', text: question, timestamp: new Date().toISOString() }])
    try {
      const reply = await api.askMentor({ kind: 'problem', problemSlug: problem.slug }, question, turn)
      setBalance(reply.balance)
      setMessages((prev) => [...prev, reply.answer])
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== pendingId))
      throw e
    }
  }

  const openAi = () => {
    setAiOpen(true)
    setNeedsHelp(false)
  }

  const splitVars = { '--left-w': `${leftWidth}%`, '--editor-h': `${editorHeight}%` } as CSSProperties

  return (
    <>
      <PixelBackdrop scene="vault" />
      <div className="relative z-10 p-3 sm:p-4">
        <section
          aria-label={`${problem.title} play board`}
          className="pixel-frame relative flex flex-col overflow-hidden bg-[var(--color-surface)] lg:h-[calc(100dvh_-_var(--topbar-h,0px)_-_2rem)] lg:min-h-[560px]"
        >
          {/* Board header */}
          <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-[var(--pixel-ink)] bg-[var(--color-surface-elevated)] px-3 py-2.5 sm:px-4">
            <Link
              to="/practice"
              aria-label="Back to Practice"
              className="flex h-9 w-9 items-center justify-center border-2 border-[var(--color-border-strong)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex min-w-0 flex-1 basis-[calc(100%-3.5rem)] flex-wrap items-center gap-x-3 gap-y-1 sm:basis-auto">
              <h1 className="text-xl">{problem.title}</h1>
              <Badge variant={difficultyVariant(problem.difficulty)} className="capitalize">
                {problem.difficulty}
              </Badge>
              <Badge variant="warning">
                <PixelSprite sprite="star" scale={1} /> +{problem.xp} XP
              </Badge>
              {duel && rival && (duelLive || duelResult) && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 border-2 px-2 py-0.5 font-pixel text-xs',
                    duelLive && remaining <= 60 ? 'animate-pulse border-[var(--color-error)] text-[var(--color-error)]' : 'border-[var(--color-violet)] bg-[var(--color-violet-soft)] text-[var(--color-violet)]',
                  )}
                  aria-live="polite"
                >
                  <Swords className="h-3.5 w-3.5" />
                  Duel vs {rival.username.split(' ')[0]} · {duelLive ? formatDuration(Math.max(0, remaining)) : duelResult?.status === 'won' ? 'Won!' : duelResult?.status === 'draw' ? 'Draw' : 'Lost'}
                </span>
              )}
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <button
                type="button"
                onClick={openAi}
                data-sound="open"
                aria-expanded={aiOpen}
                aria-controls="quest-ai-drawer"
                className={cn(
                  'relative flex h-9 items-center gap-2 border-2 px-3 font-pixel text-sm transition-colors',
                  aiOpen
                    ? 'border-[var(--color-violet)] bg-[var(--color-violet-soft)] text-[var(--color-violet)]'
                    : 'border-[var(--color-violet)]/40 text-[var(--color-text-primary)] hover:border-[var(--color-violet)] hover:bg-[var(--color-violet-soft)]',
                )}
              >
                <QuestAIAvatar size={18} className={cn(needsHelp && 'animate-pixel-bob')} />
                <span className="hidden sm:inline">Quest AI</span>
                {needsHelp && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 bg-[var(--color-error)]" aria-label="Quest AI has a suggestion" />}
              </button>
              <Button variant="secondary" size="sm" className="h-9" onClick={() => runSubmission(false)} disabled={isRunning} data-sound="none" title="Run (Ctrl+Enter)">
                <Play className="h-3.5 w-3.5" /> Run
              </Button>
              <Button size="sm" className="h-9" onClick={() => runSubmission(true)} disabled={isRunning} data-sound="none" title="Submit (Ctrl+Shift+Enter)">
                <Send className="h-3.5 w-3.5" /> Submit
              </Button>
            </div>
          </header>

          {/* Board body: problem | editor over console */}
          <div ref={bodyRef} style={splitVars} className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="h-[55vh] min-h-0 border-b-2 border-[var(--pixel-ink)] lg:h-auto lg:w-[var(--left-w)] lg:border-b-0">
              <ProblemPanel problem={problem} />
            </div>

            <ResizeHandle
              containerRef={bodyRef}
              orientation="vertical"
              value={leftWidth}
              min={26}
              max={62}
              onChange={setLeftWidth}
              label="Resize problem and editor panes"
            />

            <div ref={rightRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className={cn('h-[420px] min-h-0 lg:h-[var(--editor-h)]', shaking && 'animate-pixel-shake')}>
                <CodeEditor
                  language={language}
                  value={code}
                  onChange={setCode}
                  onLanguageChange={handleLanguageChange}
                  onReset={handleReset}
                  onRun={() => runSubmission(false)}
                  onSubmit={() => runSubmission(true)}
                />
              </div>

              <ResizeHandle
                containerRef={rightRef}
                orientation="horizontal"
                value={editorHeight}
                min={30}
                max={80}
                onChange={setEditorHeight}
                label="Resize editor and console panes"
              />

              <div className="min-h-[300px] flex-1 border-t-2 border-[var(--pixel-ink)] lg:min-h-0 lg:border-t-0">
                <CodeConsole
                  problem={problem}
                  tab={consoleTab}
                  onTabChange={setConsoleTab}
                  result={result}
                  isRunning={isRunning}
                  submitted={submitted}
                  onTryAgain={handleReset}
                />
              </div>
            </div>

            {/* Quest AI drawer */}
            <AnimatePresence>
              {aiOpen && (
                <>
                  <motion.div
                    className="absolute inset-0 z-20 bg-black/40 lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setAiOpen(false)}
                  />
                  <motion.aside
                    id="quest-ai-drawer"
                    aria-label="Quest AI mentor"
                    className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[380px] flex-col border-l-2 border-[var(--color-violet)] bg-[var(--color-surface)] shadow-[-8px_0_0_rgba(0,0,0,0.35)]"
                    initial={reduceMotion ? false : { x: '100%' }}
                    animate={{ x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  >
                    <button
                      type="button"
                      onClick={() => setAiOpen(false)}
                      data-sound="close"
                      aria-label="Close Quest AI"
                      className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-violet)] hover:text-[var(--color-violet)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <AICoach messages={messages} onAsk={handleAsk} suggestions={suggestions} className="h-full border-0 shadow-none" />
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <VictoryOverlay
        open={victoryOpen}
        xp={problem.xp}
        awardedXp={awardedXp}
        title={`${problem.title} solved — all tests passed`}
        extra={duelResult && rival ? <DuelOutcome duel={duelResult} rivalName={rival.username} /> : undefined}
        onClose={() => setVictoryOpen(false)}
      />
      {duelResult && rival && duelResult.mySeconds === null && !victoryOpen && (
        <div role="alert" className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md border-2 border-[var(--color-error)] bg-[var(--color-surface)] p-4 shadow-[6px_6px_0_var(--pixel-ink)]">
          <p className="font-pixel text-lg text-[var(--color-error)]">Time's up!</p>
          <DuelOutcome duel={duelResult} rivalName={rival.username} />
          <Link to="/challenges" className={cn(buttonVariants({ variant: 'pixelDark', size: 'sm' }), 'mt-3')}>
            Back to duels
          </Link>
        </div>
      )}
    </>
  )
}

function DuelOutcome({ duel, rivalName }: { duel: Duel; rivalName: string }) {
  const first = rivalName.split(' ')[0]
  const mine = duel.mySeconds == null ? 'out of time' : formatDuration(duel.mySeconds)
  if (duel.status === 'active') {
    // My time is in; a real opponent is still solving — the result arrives on the Challenges page.
    return (
      <div className="border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-left">
        <p className="font-pixel text-sm text-[var(--color-violet)]">Your time is in: {mine}</p>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Waiting for {first} to finish — check the Challenges page for the result.</p>
      </div>
    )
  }
  const theirs = duel.friendSeconds === null ? "didn't finish" : formatDuration(duel.friendSeconds)
  const tone = duel.status === 'won' ? 'text-[var(--color-success)]' : duel.status === 'draw' ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'
  const headline = duel.status === 'won' ? `You beat ${first}!` : duel.status === 'draw' ? `Draw with ${first}` : `${first} won this duel`
  const stakes =
    duel.status === 'won'
      ? `+${duel.stake * 2} XP stakes + ${DUEL_WIN_BONUS} XP win bonus`
      : duel.status === 'draw'
        ? duel.stake
          ? `Your ${duel.stake} XP stake was returned`
          : 'Nobody wins this one'
        : duel.stake
          ? `Your ${duel.stake} XP stake goes to ${first}`
          : 'Friendly duel — no XP lost'
  return (
    <div className="border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-left">
      <p className={cn('font-pixel text-sm', tone)}>{headline}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
        You: {mine} · {first}: {theirs}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{stakes}</p>
    </div>
  )
}
