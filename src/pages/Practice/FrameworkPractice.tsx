import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronRight } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import type { FrameworkSummary } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

/** One practice quiz per lesson of a framework's docs. */
export function FrameworkPractice({ framework }: { framework: FrameworkSummary }) {
  const { data: topics, isError, error } = useQuery({
    queryKey: ['framework-practice', framework.courseId],
    queryFn: () => api.getFrameworkPractice(framework.courseId),
  })

  if (isError) return <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">{errorMessage(error)}</p>
  if (!topics) return <p className="py-10 text-center font-pixel text-sm text-[var(--color-text-muted)]">Loading quizzes…</p>

  const sections = topics.reduce<{ name: string; items: typeof topics }[]>((acc, topic) => {
    const last = acc[acc.length - 1]
    if (last && last.name === topic.section) last.items.push(topic)
    else acc.push({ name: topic.section, items: [topic] })
    return acc
  }, [])

  return (
    <section aria-label={`${framework.title} practice quizzes`}>
      <p className="mb-5 max-w-2xl text-sm text-[var(--color-text-secondary)]">
        Each quiz asks you to fill in the key terms from one lesson of the {framework.title} docs. Pass with 70% to earn XP (once per lesson). You can retake
        any quiz as often as you like. {framework.solved} of {framework.topics} passed.
      </p>
      <div className="space-y-5">
        {sections.map((section) => (
          <Card key={section.name} className="overflow-hidden">
            <h2 className="border-b-2 border-[var(--color-border)] px-5 py-3 font-pixel text-xs uppercase tracking-wider text-[var(--color-accent)]">{section.name}</h2>
            <ul className="divide-y-2 divide-[var(--color-border)]">
              {section.items.map((topic) => (
                <li key={topic.lessonId}>
                  <Link
                    to={`/quiz/fwq-practice-${topic.lessonId}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-surface-elevated)]"
                  >
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 ${topic.solved ? 'border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'border-[var(--color-border-strong)]'}`}
                    >
                      {topic.solved && <Check className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{topic.title}</span>
                    {topic.bestPercent != null && <Badge variant={topic.solved ? 'success' : 'neutral'}>Best {topic.bestPercent}%</Badge>}
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  )
}
