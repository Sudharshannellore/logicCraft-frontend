import type { ReactNode } from 'react'
import type { ResumeData, ResumeEntry, ResumeTemplateId } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'

/*
 * Every template is text-only — no sidebars, colour blocks or images — so applicant tracking
 * systems parse it cleanly. Templates differ only in type, rules, header layout and section order.
 */

/** Brackets mark placeholders the AI left for the user to fill — highlighted so they're not sent by accident. */
function BulletText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/).map((part, i) =>
        part.startsWith('[') ? (
          <mark key={i} className="bg-[#fff3c4] px-0.5 text-[#7a5200]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

type SectionKey = 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'achievements'

const DEFAULT_ORDER: SectionKey[] = ['summary', 'skills', 'experience', 'projects', 'education', 'achievements']
const EDUCATION_FIRST: SectionKey[] = ['summary', 'education', 'experience', 'projects', 'skills', 'achievements']
const FRESHER_ORDER: SectionKey[] = ['summary', 'education', 'skills', 'projects', 'experience', 'achievements']

const TITLES: Record<SectionKey, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  achievements: 'Achievements',
}

interface EntryStyle {
  title: string
  subtitle: string
  period: string
  bullets: string
  /** Subtitle on its own line under the title (e.g. Harvard: company in italics). */
  subtitleBelow?: boolean
}

interface Spec {
  /** Font family and page padding. */
  root: string
  header: (data: ResumeData, contact: string[]) => ReactNode
  Section: (props: { title: string; children: ReactNode }) => ReactNode
  entry: EntryStyle
  /** Paragraph text (summary, skills line). */
  text: string
  order?: SectionKey[]
  titles?: Partial<Record<SectionKey, string>>
  skillsSeparator?: string
}

function Entry({ entry, s }: { entry: ResumeEntry; s: EntryStyle }) {
  const bullets = entry.bullets.filter(Boolean)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className={s.title}>
          {entry.title}
          {entry.subtitle && !s.subtitleBelow && <span className={s.subtitle}> · {entry.subtitle}</span>}
        </p>
        {entry.period && <p className={cn('shrink-0', s.period)}>{entry.period}</p>}
      </div>
      {entry.subtitle && s.subtitleBelow && <p className={s.subtitle}>{entry.subtitle}</p>}
      {bullets.length > 0 && (
        <ul className={cn('mt-1 space-y-0.5', s.bullets)}>
          {bullets.map((b, i) => (
            <li key={i}>
              <BulletText text={b} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Body({ data, spec }: { data: ResumeData; spec: Spec }) {
  const { Section, entry, text } = spec
  const visible = (entries: ResumeEntry[]) => entries.filter((e) => e.title.trim())
  const user = useAuthStore((s) => s.user)
  const achievements = data.includeCodeQuestStats && user
    ? [
        `Ranked #${user.rank} globally on Logicraft (${user.league.label} league) with ${user.stats.problemsSolved} problems solved at ${user.stats.accuracy}% accuracy.`,
        `${user.stats.challengesWon} competitive coding challenges won; ${user.stats.longestStreak}-day longest practice streak.`,
      ]
    : []
  const entries = (list: ResumeEntry[]) => visible(list).map((e) => <Entry key={e.id} entry={e} s={entry} />)

  const content: Record<SectionKey, ReactNode> = {
    summary: data.summary.trim() ? <p className={text}>{data.summary}</p> : null,
    skills: data.skills.length ? <p className={text}>{data.skills.join(spec.skillsSeparator ?? '  ·  ')}</p> : null,
    experience: visible(data.experience).length ? entries(data.experience) : null,
    projects: visible(data.projects).length ? entries(data.projects) : null,
    education: visible(data.education).length ? entries(data.education) : null,
    achievements: achievements.length ? (
      <ul className={cn('space-y-0.5', entry.bullets)}>
        {achievements.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    ) : null,
  }

  return (
    <>
      {(spec.order ?? DEFAULT_ORDER).map((key) =>
        content[key] ? (
          <Section key={key} title={spec.titles?.[key] ?? TITLES[key]}>
            {content[key]}
          </Section>
        ) : null,
      )}
    </>
  )
}

const contactOf = (data: ResumeData) => [data.email, data.phone, data.location, data.links].filter(Boolean)
const nameOf = (data: ResumeData) => data.name || 'Your Name'

/* ---------------- Template specs ---------------- */

const specs: Record<ResumeTemplateId, Spec> = {
  classic: {
    root: 'px-10 py-9 font-sans',
    header: (d, c) => (
      <header>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#13151a]">{nameOf(d)}</h1>
        {d.headline && <p className="mt-0.5 text-[14px] font-medium text-[#2c6a12]">{d.headline}</p>}
        {c.length > 0 && <p className="mt-1.5 text-[11.5px] text-[#565d68]">{c.join('  ·  ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-5">
        <h2 className="border-b border-[#d4d8de] pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2c6a12]">{title}</h2>
        <div className="mt-2.5 space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-semibold text-[#13151a]',
      subtitle: 'font-normal text-[#565d68]',
      period: 'text-[11px] text-[#565d68]',
      bullets: 'list-disc pl-4 text-[12px] leading-[1.5] text-[#2d3139]',
    },
    text: 'text-[12.5px] leading-[1.55] text-[#2d3139]',
  },

  minimal: {
    root: 'px-14 py-12 font-serif',
    header: (d, c) => (
      <header className="text-center">
        <h1 className="font-serif text-[30px] font-normal tracking-[0.06em] text-[#111]">{nameOf(d)}</h1>
        {d.headline && <p className="mt-1 text-[13px] italic text-[#555]">{d.headline}</p>}
        {c.length > 0 && <p className="mt-2 text-[11px] text-[#555]">{c.join('   |   ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-3 font-serif text-[11px] font-normal uppercase tracking-[0.32em] text-[#444]">
          {title}
          <span className="h-px flex-1 bg-[#cfcfcf]" />
        </h2>
        <div className="space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-bold text-[#111]',
      subtitle: 'font-normal italic text-[#555]',
      period: 'text-[11px] italic text-[#555]',
      bullets: 'list-[square] pl-4 text-[12px] leading-[1.6] text-[#333]',
    },
    text: 'text-[12.5px] leading-[1.6] text-[#333]',
  },

  ats: {
    root: 'px-12 py-10 font-[Arial,Helvetica,sans-serif]',
    header: (d, c) => (
      <header>
        <h1 className="text-[22px] font-bold text-black">{nameOf(d)}</h1>
        {d.headline && <p className="text-[13px] text-black">{d.headline}</p>}
        {c.length > 0 && <p className="mt-1 text-[12px] text-black">{c.join(' | ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-5">
        <h2 className="text-[13px] font-bold uppercase text-black">{title}</h2>
        <div className="mt-1.5 space-y-2.5">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[12.5px] font-bold text-black',
      subtitle: 'font-normal text-black',
      period: 'text-[12px] text-black',
      bullets: 'list-disc pl-5 text-[12px] leading-[1.5] text-black',
    },
    text: 'text-[12px] leading-[1.5] text-black',
    skillsSeparator: ', ',
  },

  professional: {
    root: 'px-11 py-10 font-sans',
    header: (d, c) => (
      <header className="flex items-end justify-between gap-6 border-b-2 border-[#111827] pb-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#111827]">{nameOf(d)}</h1>
          {d.headline && <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#374151]">{d.headline}</p>}
        </div>
        <div className="space-y-0.5 text-right text-[11px] text-[#374151]">
          {c.map((x) => (
            <p key={x}>{x}</p>
          ))}
        </div>
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-5">
        <h2 className="border-b border-[#9ca3af] pb-0.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#111827]">{title}</h2>
        <div className="mt-2.5 space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-bold text-[#111827]',
      subtitle: 'font-normal text-[#4b5563]',
      period: 'text-[11px] font-medium text-[#4b5563]',
      bullets: 'list-disc pl-4 text-[12px] leading-[1.5] text-[#1f2937]',
    },
    text: 'text-[12.5px] leading-[1.55] text-[#1f2937]',
  },

  harvard: {
    root: "px-14 py-11 font-['Times_New_Roman',Times,serif]",
    header: (d, c) => (
      <header className="text-center">
        <h1 className="text-[22px] font-bold uppercase tracking-[0.04em] text-black">{nameOf(d)}</h1>
        {c.length > 0 && <p className="mt-1 text-[12px] text-black">{c.join(' • ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-4">
        <h2 className="border-b border-black text-[13px] font-bold uppercase text-black">{title}</h2>
        <div className="mt-2 space-y-2.5">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-bold text-black',
      subtitle: 'text-[12.5px] italic text-black',
      period: 'text-[12px] text-black',
      bullets: 'list-disc pl-5 text-[12.5px] leading-[1.45] text-black',
      subtitleBelow: true,
    },
    text: 'text-[12.5px] leading-[1.5] text-black',
    order: EDUCATION_FIRST,
    skillsSeparator: ', ',
  },

  student: {
    root: 'px-11 py-10 font-sans',
    header: (d, c) => (
      <header>
        <h1 className="text-[26px] font-bold text-[#0f172a]">{nameOf(d)}</h1>
        {d.headline && <p className="text-[13px] text-[#15803d]">{d.headline}</p>}
        {c.length > 0 && <p className="mt-1 text-[11.5px] text-[#475569]">{c.join('  |  ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-5">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#15803d]">{title}</h2>
        <div className="mt-1 border-t border-dotted border-[#94a3b8] pt-2">
          <div className="space-y-3">{children}</div>
        </div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-semibold text-[#0f172a]',
      subtitle: 'font-normal text-[#475569]',
      period: 'text-[11px] text-[#475569]',
      bullets: 'list-disc pl-4 text-[12px] leading-[1.5] text-[#1e293b]',
    },
    text: 'text-[12.5px] leading-[1.55] text-[#1e293b]',
    order: FRESHER_ORDER,
    titles: { summary: 'Objective', projects: 'Academic & Personal Projects' },
  },

  developer: {
    root: 'px-10 py-9 font-sans',
    header: (d, c) => (
      <header className="border-b border-[#d4d4d8] pb-3">
        <h1 className="font-mono text-[25px] font-bold tracking-tight text-[#111827]">{nameOf(d)}</h1>
        {d.headline && <p className="font-mono text-[13px] text-[#6d28d9]">// {d.headline}</p>}
        {c.length > 0 && <p className="mt-1.5 font-mono text-[10.5px] text-[#52525b]">{c.join('  ·  ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-5">
        <h2 className="font-mono text-[12px] font-bold lowercase text-[#6d28d9]">## {title}</h2>
        <div className="mt-2 space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-semibold text-[#111827]',
      subtitle: 'font-mono text-[11px] font-normal text-[#52525b]',
      period: 'font-mono text-[10.5px] text-[#52525b]',
      bullets: 'list-disc pl-4 text-[12px] leading-[1.5] text-[#27272a]',
    },
    text: 'font-mono text-[11.5px] leading-[1.6] text-[#27272a]',
    skillsSeparator: ' / ',
    titles: { skills: 'Tech stack' },
  },

  typewriter: {
    root: "px-12 py-10 font-['Courier_New',Courier,monospace]",
    header: (d, c) => (
      <header>
        <h1 className="text-[22px] font-bold uppercase tracking-[0.08em] text-[#111]">{nameOf(d)}</h1>
        {d.headline && <p className="text-[12.5px] text-[#111]">{d.headline}</p>}
        {c.length > 0 && <p className="mt-1 text-[11px] text-[#333]">{c.join(' / ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-5">
        <h2 className="border-b border-dashed border-[#555] pb-0.5 text-[12.5px] font-bold uppercase tracking-[0.1em] text-[#111]">{title}</h2>
        <div className="mt-2 space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[12.5px] font-bold text-[#111]',
      subtitle: 'font-normal text-[#333]',
      period: 'text-[11px] text-[#333]',
      bullets: 'list-["-__"] pl-4 text-[11.5px] leading-[1.55] text-[#222]',
    },
    text: 'text-[11.5px] leading-[1.6] text-[#222]',
    skillsSeparator: ', ',
  },

  compact: {
    root: 'px-9 py-8 font-sans',
    header: (d, c) => (
      <header className="flex items-baseline justify-between gap-6 border-b border-[#0f766e] pb-2">
        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[#0f172a]">{nameOf(d)}</h1>
          {d.headline && <p className="text-[12px] font-medium text-[#0f766e]">{d.headline}</p>}
        </div>
        {c.length > 0 && <p className="max-w-[55%] text-right text-[10.5px] leading-[1.5] text-[#475569]">{c.join(' · ')}</p>}
      </header>
    ),
    // Headings sit in the left margin; content runs beside them.
    Section: ({ title, children }) => (
      <section className="mt-3 grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-[#e2e8f0] pb-3 last:border-0">
        <h2 className="pt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f766e]">{title}</h2>
        <div className="space-y-2">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[11.5px] font-semibold text-[#0f172a]',
      subtitle: 'font-normal text-[#475569]',
      period: 'text-[10px] text-[#64748b]',
      bullets: 'list-disc pl-3.5 text-[11px] leading-[1.45] text-[#334155]',
    },
    text: 'text-[11px] leading-[1.5] text-[#334155]',
  },

  elegant: {
    root: 'px-14 py-12 font-[Georgia,serif]',
    header: (d, c) => (
      <header className="text-center">
        <h1 className="text-[28px] font-normal uppercase tracking-[0.22em] text-[#1c1917]">{nameOf(d)}</h1>
        {d.headline && <p className="mt-1 text-[13px] italic text-[#7f1d1d]">{d.headline}</p>}
        {c.length > 0 && <p className="mt-2 text-[11px] tracking-wide text-[#57534e]">{c.join('  ◆  ')}</p>}
        <div className="mx-auto mt-4 h-px w-24 bg-[#7f1d1d]" />
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-6">
        <h2 className="mb-2 text-[16px] font-normal italic text-[#7f1d1d]">{title}</h2>
        <div className="space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-bold text-[#1c1917]',
      subtitle: 'font-normal italic text-[#57534e]',
      period: 'text-[11px] italic text-[#57534e]',
      bullets: 'list-disc pl-4 text-[12px] leading-[1.6] text-[#292524]',
    },
    text: 'text-[12.5px] leading-[1.65] text-[#292524]',
  },

  bold: {
    root: 'px-11 py-10 font-sans',
    header: (d, c) => (
      <header>
        <h1 className="text-[36px] font-black uppercase leading-none tracking-tight text-black">{nameOf(d)}</h1>
        {d.headline && <p className="mt-1.5 text-[14px] font-bold uppercase tracking-[0.1em] text-[#404040]">{d.headline}</p>}
        {c.length > 0 && <p className="mt-2 text-[11.5px] font-medium text-[#404040]">{c.join('  /  ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-6">
        <h2 className="border-b-[3px] border-black pb-0.5 text-[14px] font-black uppercase tracking-tight text-black">{title}</h2>
        <div className="mt-2.5 space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'text-[13px] font-extrabold text-black',
      subtitle: 'font-semibold text-[#525252]',
      period: 'text-[11px] font-bold text-[#525252]',
      bullets: 'list-disc pl-4 text-[12px] leading-[1.5] text-[#171717]',
    },
    text: 'text-[12.5px] leading-[1.55] text-[#171717]',
  },

  executive: {
    root: 'px-12 py-11 font-sans',
    header: (d, c) => (
      <header className="border-b border-[#c9a24d] pb-4">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-[#1f2a44]">{nameOf(d)}</h1>
        {d.headline && <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#a07a2c]">{d.headline}</p>}
        {c.length > 0 && <p className="mt-2 text-[11px] text-[#5b6478]">{c.join('   ·   ')}</p>}
      </header>
    ),
    Section: ({ title, children }) => (
      <section className="mt-6">
        <h2 className="font-serif text-[16px] font-bold text-[#1f2a44]">{title}</h2>
        <div className="mb-3 mt-1 h-[2px] w-10 bg-[#c9a24d]" />
        <div className="space-y-3">{children}</div>
      </section>
    ),
    entry: {
      title: 'font-serif text-[13.5px] font-bold text-[#1f2a44]',
      subtitle: 'font-sans text-[12px] font-normal text-[#5b6478]',
      period: 'text-[11px] uppercase tracking-wider text-[#a07a2c]',
      bullets: 'list-disc pl-4 text-[12px] leading-[1.55] text-[#2f3747]',
    },
    text: 'text-[12.5px] leading-[1.6] text-[#2f3747]',
  },
}

/** A4-proportioned white paper rendered in the chosen template. */
export function ResumePreview({ data, template = 'classic', className }: { data: ResumeData; template?: ResumeTemplateId; className?: string }) {
  const spec = specs[template] ?? specs.classic
  return (
    <article aria-label="Resume preview" className={cn('resume-paper min-h-[1122px] bg-white text-[#13151a]', spec.root, className)}>
      {spec.header(data, contactOf(data))}
      <Body data={data} spec={spec} />
    </article>
  )
}
