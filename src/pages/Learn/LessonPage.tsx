import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Clock, X } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import type { AIMessage, Lesson } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button, buttonVariants } from '@/components/ui/Button'
import { PageLoader } from '@/components/layout/PageLoader'
import { LessonResources } from '@/components/learning/LessonResources'
import { StepCode, StepComplete, StepConcept, StepExercise, StepVisualize } from '@/components/learning/LessonSteps'
import { AICoach } from '@/components/ai/AICoach'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

type StepId = 'concept' | 'visualize' | 'code' | 'exercise'

interface Step {
  id: StepId
  label: string
  title: string
  sprite: SpriteName
}

function buildSteps(lesson: Lesson): Step[] {
  const steps: Step[] = [{ id: 'concept', label: 'Concept', title: `Understanding ${lesson.concept}`, sprite: 'book' }]
  if (lesson.concept.toLowerCase().includes('hash')) steps.push({ id: 'visualize', label: 'Visualize', title: 'See it in action', sprite: 'treasureMap' })
  if (lesson.codeExample) steps.push({ id: 'code', label: 'Code', title: 'Read the code', sprite: 'terminal' })
  if (lesson.exercise) steps.push({ id: 'exercise', label: 'Practice', title: 'Put it to work', sprite: 'sword' })
  return steps
}

function StepProgress({ steps, current, maxReached, onJump }: { steps: Step[]; current: number; maxReached: number; onJump: (i: number) => void }) {
  return (
    <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Lesson progress">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        const reachable = i <= maxReached
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onJump(i)}
              aria-current={active ? 'step' : undefined}
              className="group w-full text-left disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  'block h-2.5 transition-colors',
                  done && 'bg-[var(--color-accent)]',
                  active && 'bg-[var(--color-accent)] shadow-[0_0_0_2px_var(--color-accent-soft)]',
                  !done && !active && 'bg-[var(--color-surface-elevated)]',
                  reachable && !active && 'group-hover:brightness-125',
                )}
              />
              <span
                className={cn(
                  'mt-1.5 hidden truncate font-pixel text-xs sm:block',
                  active ? 'text-[var(--color-accent)]' : done ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]',
                )}
              >
                {step.label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default function LessonPage() {
  const { courseId = '', lessonId = '' } = useParams<{ courseId: string; lessonId: string }>()
  const { data: course } = useQuery({ queryKey: ['course', courseId], queryFn: () => api.getCourse(courseId), enabled: Boolean(courseId) })
  const { data: lesson, error: lessonError } = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => api.getLesson(lessonId), enabled: Boolean(lessonId) })
  const reduceMotion = useReducedMotion()
  const queryClient = useQueryClient()

  const [index, setIndex] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [aiOpen, setAiOpen] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [lessonAward, setLessonAward] = useState<number | null>(null)
  const [finishError, setFinishError] = useState<string | null>(null)
  const setBalance = useWalletStore((s) => s.setBalance)

  const steps = useMemo(() => (lesson ? buildSteps(lesson) : []), [lesson])
  const currentStep = steps[index]?.id
  const { data: suggestions = [] } = useQuery({
    queryKey: ['mentor-suggestions', 'lesson', lessonId, currentStep],
    queryFn: () => api.getMentorSuggestions({ kind: 'lesson', ref: lessonId, step: currentStep }),
    enabled: Boolean(lesson),
  })

  useEffect(() => {
    if (!lesson) return
    setMessages([
      {
        id: 'intro',
        role: 'ai',
        text: `I'm here for "${lesson.title}". Stuck on a step? Ask me anything, or pick a suggested question below.`,
        timestamp: new Date().toISOString(),
      },
    ])
  }, [lesson])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [index, reduceMotion])

  useEffect(() => {
    if (!aiOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAiOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiOpen])

  if (lesson === null || course === null || lessonError) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <PixelSprite sprite="bugSlime" scale={5} fps={3} className="animate-pixel-bob" />
        <h1 className="text-xl">{lessonError ? "Couldn't load this lesson" : 'Lesson not found'}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {lessonError ? errorMessage(lessonError) : 'It may have moved, or this topic has no lesson yet.'}
        </p>
        <Link to={courseId ? `/learn/${courseId}` : '/learn'} className={buttonVariants({ variant: 'pixel' })}>
          Back to the map
        </Link>
      </div>
    )
  }
  if (!course || !lesson) return <PageLoader />

  const isComplete = index >= steps.length
  const step = steps[index]
  const xp = lesson.xp ?? 50
  const moduleTitle = course.modules.find((m) => m.id === lesson.moduleId)?.title

  const finishLesson = async () => {
    setFinishError(null)
    try {
      const completion = await api.completeLesson(lesson.id)
      setBalance(completion.balance)
      setLessonAward(completion.awarded)
      // The map, course progress and today's quest all moved on.
      void queryClient.invalidateQueries({ queryKey: ['course-path', courseId] })
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
      void queryClient.invalidateQueries({ queryKey: ['paths'] })
      void queryClient.invalidateQueries({ queryKey: ['path'] })
      void queryClient.invalidateQueries({ queryKey: ['daily-quest'] })
      void queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
      return true
    } catch (e) {
      setFinishError(errorMessage(e))
      return false
    }
  }

  const goTo = async (i: number) => {
    if (i >= steps.length && lessonAward === null && !(await finishLesson())) return
    setIndex(i)
    setMaxReached((m) => Math.max(m, i))
  }

  const handleAsk = async (question: string) => {
    const now = new Date().toISOString()
    const turn = messages.filter((m) => m.role === 'user').length
    const pendingId = `u-${Date.now()}`
    setMessages((prev) => [...prev, { id: pendingId, role: 'user', text: question, timestamp: now }])
    try {
      const reply = await api.askMentor({ kind: 'lesson', lessonId: lesson.id, step: step?.id }, question, turn)
      setBalance(reply.balance)
      setMessages((prev) => [...prev, reply.answer])
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== pendingId))
      throw e
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1500px] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      {/* Lesson header */}
      <header className="mb-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/learn/${courseId}`}
            className="inline-flex items-center gap-1.5 font-pixel text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {course.title}
          </Link>
          <div className="flex items-center gap-2">
            {lesson.estimatedMinutes && (
              <span className="hidden items-center gap-1.5 border-2 border-[var(--color-border-strong)] px-2 py-1 font-pixel text-xs text-[var(--color-text-secondary)] sm:flex">
                <Clock className="h-3.5 w-3.5" /> {lesson.estimatedMinutes} min
              </span>
            )}
            <span className="flex items-center gap-1.5 border-2 border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-2 py-1 font-pixel text-xs text-[var(--color-warning)]">
              <PixelSprite sprite="star" scale={1} /> +{xp} XP
            </span>
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              aria-expanded={aiOpen}
              aria-controls="lesson-ai-drawer"
              className="flex items-center gap-2 border-2 border-[var(--color-violet)]/50 px-2.5 py-1 font-pixel text-xs text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-violet)] hover:bg-[var(--color-violet-soft)]"
            >
              <QuestAIAvatar size={16} /> Ask Quest AI
            </button>
          </div>
        </div>

        <p className="mb-1 flex items-center gap-2 font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
          <PixelSprite sprite="book" scale={1.5} /> {moduleTitle ?? lesson.concept}
        </p>
        <h1 className="mb-5 text-3xl sm:text-4xl lg:text-5xl">{lesson.title}</h1>
        <StepProgress steps={steps} current={index} maxReached={maxReached} onJump={goTo} />
      </header>

      {/* Step body */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isComplete ? 'complete' : step.id}
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-1 flex-col"
        >
          <Card className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
            {isComplete ? (
              <div className="flex flex-1 items-center justify-center">
                <StepComplete lesson={lesson} courseId={courseId} awardedXp={lessonAward ?? 0} />
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="pixel-corners flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
                    <PixelSprite sprite={step.sprite} scale={2.5} fps={step.sprite === 'terminal' ? 2 : 0} />
                  </div>
                  <div>
                    <p className="font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                      Step {index + 1} of {steps.length}
                    </p>
                    <h2 className="text-2xl lg:text-3xl">{step.title}</h2>
                  </div>
                </div>

                {step.id === 'concept' && <StepConcept lesson={lesson} />}
                {step.id === 'visualize' && <StepVisualize />}
                {step.id === 'code' && <StepCode lesson={lesson} language={course.language} />}
                {step.id === 'exercise' && <StepExercise lesson={lesson} />}
              </>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Step navigation */}
      {!isComplete && (
        <nav aria-label="Lesson steps" className="mt-6 flex items-center justify-between gap-3">
          <Button variant="pixelDark" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="pixel" size="lg" onClick={() => goTo(index + 1)}>
              {index === steps.length - 1 ? 'Finish lesson' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}
      {finishError && (
        <p role="alert" className="mt-3 text-right text-sm text-[var(--color-error)]">
          {finishError}
        </p>
      )}

      <LessonResources lessonId={lesson.id} className="mt-8" />

      {/* Quest AI drawer */}
      <AnimatePresence>
        {aiOpen && (
          <>
            <motion.div
              className="fixed inset-0 top-16 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiOpen(false)}
            />
            <motion.aside
              id="lesson-ai-drawer"
              aria-label="Quest AI mentor"
              className="fixed bottom-0 right-0 top-16 z-40 flex w-full max-w-[380px] flex-col border-l-2 border-[var(--color-violet)] bg-[var(--color-surface)] shadow-[-8px_0_0_rgba(0,0,0,0.35)]"
              initial={reduceMotion ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <button
                type="button"
                onClick={() => setAiOpen(false)}
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
  )
}
