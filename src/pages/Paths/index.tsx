import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { PageLoader } from '@/components/layout/PageLoader'
import { PathCard } from '@/components/learning/PathCard'

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-pixel text-sm uppercase tracking-wider text-[var(--color-accent)]">{title}</h2>
      {hint && <p className="mb-3 mt-1 text-sm text-[var(--color-text-secondary)]">{hint}</p>}
      <div className={hint ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>{children}</div>
    </section>
  )
}

export default function Paths() {
  const { data: paths, isError } = useQuery({ queryKey: ['paths'], queryFn: api.getPaths })

  if (isError) {
    return <p className="mx-auto max-w-xl px-4 py-24 text-center text-sm text-[var(--color-text-secondary)]">Career paths couldn't be loaded right now. Try again in a minute.</p>
  }
  if (!paths) return <PageLoader />

  const suggested = paths.filter((p) => p.recommended)
  const chosen = paths.filter((p) => p.enrolled && !p.recommended)
  const rest = paths.filter((p) => !p.recommended && !p.enrolled)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career paths</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
          Pick an industry route: a language, then the frameworks teams actually use. Take the courses in any order; what you've already
          finished is marked as done.
        </p>
      </div>

      {suggested.length > 0 && (
        <Section title="Suggested for you" hint="Based on the courses you've finished or started.">
          {suggested.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </Section>
      )}
      {chosen.length > 0 && (
        <Section title="Your paths">
          {chosen.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </Section>
      )}
      {rest.length > 0 && (
        <Section title={suggested.length + chosen.length > 0 ? 'More paths' : 'All paths'}>
          {rest.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </Section>
      )}
    </div>
  )
}
