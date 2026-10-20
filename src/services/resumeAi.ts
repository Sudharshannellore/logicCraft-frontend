import type { Job, JobMatch, ResumeData, TailorResult } from '@/types'

/**
 * Resume helpers that run in the browser for instant feedback. Every paid Quest AI action (summary,
 * bullets, skills, tailoring, cover notes) runs on the server, which charges the XP; these are the same
 * keyword rules the server uses, so a live score shown while editing matches what it will compute.
 */

/** XP prices — must match the server (GET /config/economy). */
export const RESUME_AI_COST = {
  summary: 30,
  bullet: 10,
  skills: 15,
  tailor: 50,
  coverNote: 25,
} as const

/** Skills evidenced by cleared Logicraft topics (what "Suggest skills" can add). */
const EARNED_SKILLS = ['Data Structures', 'Algorithms', 'Hash Tables', 'Recursion', 'Problem Solving', 'SQL Joins', 'Git']

export function suggestSkills(existing: string[]): string[] {
  const have = new Set(existing.map((s) => s.toLowerCase()))
  return EARNED_SKILLS.filter((s) => !have.has(s.toLowerCase()))
}

const KNOWN_KEYWORDS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'PostgreSQL', 'MySQL', 'Java', 'C++', 'Go',
  'REST', 'API', 'GraphQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'Testing', 'Agile', 'Algorithms',
  'Data Structures', 'Machine Learning', 'HTML', 'CSS', 'Linux', 'Microservices', 'C#', 'PHP', 'Rust', 'Kotlin',
  'Swift',
]

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mentions(text: string, keyword: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword.toLowerCase())}([^a-z0-9]|$)`).test(text)
}

function resumeText(data: ResumeData) {
  return [data.headline, data.summary, data.skills.join(' '), ...[...data.experience, ...data.projects].flatMap((e) => [e.title, e.subtitle, ...e.bullets])]
    .join(' ')
    .toLowerCase()
}

/** Which of the job's tech keywords the resume shows. */
export function matchJob(data: ResumeData, jobDescription: string): JobMatch {
  const job = jobDescription.toLowerCase()
  const text = resumeText(data)
  const wanted = KNOWN_KEYWORDS.filter((k) => mentions(job, k))
  const matched = wanted.filter((k) => mentions(text, k))
  const missing = wanted.filter((k) => !matched.includes(k))
  const score = wanted.length === 0 ? 0 : Math.round((matched.length / wanted.length) * 100)
  return { score, matched, missing }
}

/** Applies a tailoring result: the job-specific summary, and skills the job asks for listed first. Nothing is added. */
export function applyTailoring(data: ResumeData, result: TailorResult): ResumeData {
  const relevant = (skill: string) => result.matched.some((k) => mentions(skill.toLowerCase(), k))
  return { ...data, summary: result.summary, skills: [...data.skills.filter(relevant), ...data.skills.filter((s) => !relevant(s))] }
}

/** The text Quest AI reads when matching a resume to a job. */
export function jobText(job: Job): string {
  return [job.role, job.description, job.tags.join(', ')].join('\n')
}
