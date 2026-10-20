import type { SpriteName } from '@/components/pixel/sprites'

/** How each course language looks in the UI. Keyed by `course.language`, which the API sends. */

export type Track = 'Web' | 'Backend' | 'Systems' | 'Mobile' | 'Data'

export const TRACKS: Track[] = ['Web', 'Backend', 'Systems', 'Mobile', 'Data']

interface LanguageMeta {
  label: string
  /** File extension used for code-example tabs. */
  ext: string
  sprite: SpriteName
  track: Track
}

const LANGUAGES: Record<string, LanguageMeta> = {
  python: { label: 'Python', ext: 'py', sprite: 'book', track: 'Data' },
  javascript: { label: 'JavaScript', ext: 'js', sprite: 'terminal', track: 'Web' },
  sql: { label: 'SQL', ext: 'sql', sprite: 'database', track: 'Data' },
  typescript: { label: 'TypeScript', ext: 'ts', sprite: 'scroll', track: 'Web' },
  java: { label: 'Java', ext: 'java', sprite: 'potion', track: 'Backend' },
  csharp: { label: 'C#', ext: 'cs', sprite: 'gem', track: 'Backend' },
  cpp: { label: 'C++', ext: 'cpp', sprite: 'sword', track: 'Systems' },
  c: { label: 'C', ext: 'c', sprite: 'gear', track: 'Systems' },
  php: { label: 'PHP', ext: 'php', sprite: 'chest', track: 'Web' },
  go: { label: 'Go', ext: 'go', sprite: 'heroRun', track: 'Backend' },
  rust: { label: 'Rust', ext: 'rs', sprite: 'lock', track: 'Systems' },
  kotlin: { label: 'Kotlin', ext: 'kt', sprite: 'crown', track: 'Mobile' },
  swift: { label: 'Swift', ext: 'swift', sprite: 'lightning', track: 'Mobile' },
}

const FALLBACK: LanguageMeta = { label: 'Code', ext: 'txt', sprite: 'star', track: 'Backend' }

export function languageMeta(language: string | undefined): LanguageMeta {
  return (language && LANGUAGES[language]) || FALLBACK
}
