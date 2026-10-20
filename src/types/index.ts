import type { DuelView, XpBalance } from './api'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Language = 'python' | 'javascript' | 'cpp' | 'java' | 'sql'

export type League = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master'

export interface LeagueInfo {
  tier: League
  division: 1 | 2 | 3
  label: string
}

export interface UserProfile {
  id: string
  username: string
  handle: string
  email: string
  avatarColor: string
  avatarInitials: string
  level: number
  xp: number
  xpToNextLevel: number
  streakDays: number
  league: LeagueInfo
  rank: number
  joinedAt: string
  stats: {
    problemsSolved: number
    challengesWon: number
    longestStreak: number
    accuracy: number
    avgSolveTimeSeconds: number
    languages: string[]
  }
  skills: { name: string; percent: number }[]
}

export interface QuestTask {
  id: string
  label: string
  done: boolean
  progress: number
  target: number
}

export interface DailyQuest {
  id: string
  date: string
  title: string
  rewardXp: number
  progressPercent: number
  tasks: QuestTask[]
  claimed: boolean
  claimable: boolean
}

export interface CourseModule {
  id: string
  title: string
  lessonsCount: number
  exercisesCount: number
  completedLessons: number
  progressPercent: number
}

export interface Course {
  id: string
  title: string
  world: string
  description: string
  /** Language the course teaches; scopes external tutorial searches. */
  language: string
  progressPercent: number
  totalXp: number
  modules: CourseModule[]
}

export type NodeState = 'completed' | 'current' | 'locked'

export interface PathNode {
  id: string
  title: string
  state: NodeState
  difficulty: Difficulty
  xpReward: number
  estimatedMinutes: number
  /** The lesson this topic opens. */
  lessonId: string
}

/** The boss guarding the end of a zone: unlocked once every topic in the zone is cleared. */
export interface PathBoss {
  id: string
  name: string
  /** Sprite name from the pixel sprite set. */
  sprite: string
  challenge: string
  /** Rounds in the boss fight — shown as hearts. */
  stages: number
  xpReward: number
  /** completed = defeated, current = ready to fight. */
  state: NodeState
}

/** A difficulty tier of a course's world map: a group of topics that ends in a boss level. */
export interface PathZone {
  id: string
  name: string
  tagline: string
  difficulty: Difficulty
  nodes: PathNode[]
  boss: PathBoss
}

export interface Lesson {
  id: string
  courseId: string
  moduleId: string
  title: string
  concept: string
  explanation: string
  codeExample: string
  quiz: { question: string; options: string[]; correctIndex: number; explanation?: string }
  xp?: number
  estimatedMinutes?: number
  keyPoints?: string[]
  analogy?: string
  /** One note per notable line of `codeExample`, in order. */
  codeWalkthrough?: string[]
  tryIt?: {
    prompt: string
    starterCode: string
    /** Mock grader: every regex (source string) must match the learner's code. */
    checks: { pattern: string; hint: string }[]
    expectedOutput: string
  }
  /** "curated" (written by the team) or "generated" (assembled from external references). */
  source?: string
  completed?: boolean
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
}

export interface Problem {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  xp: number
  acceptanceRate: number
  tags: string[]
  description: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  hints: string[]
  starterCode: Record<Language, string>
  testCases: TestCase[]
  solved?: boolean
}

/** A problem as listed on the Practice board. */
export interface ProblemSummary {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  xp: number
  acceptanceRate: number
  tags: string[]
  solved: boolean
}

export interface TestResult {
  id: string
  passed: boolean
  input: string
  expectedOutput: string
  receivedOutput: string
  /** The exception the solution raised on this case, if any. */
  error?: string | null
}

export interface SubmissionResult {
  status: 'running' | 'passed' | 'failed' | 'error'
  runtimeMs?: number
  memoryMb?: number
  testResults: TestResult[]
  aiReview?: {
    correct: boolean
    timeComplexity: string
    spaceComplexity: string
    codeQuality: number
    recommendation: string
  }
  aiFailureExplanation?: string | null
  /** What the program printed (its own print / console.log calls). */
  stdout?: string
  /** Set when the code couldn't run: syntax error, timeout, memory limit, unsupported language. */
  error?: string | null
  /** Submit only. */
  awardedXp?: number | null
  balance?: XpBalance | null
  duel?: DuelView | null
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatarColor: string
  avatarInitials: string
  level: number
  xp: number
  winRate: number
  badges: string[]
  isCurrentUser?: boolean
}

export interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface AIMessage {
  id: string
  role: 'ai' | 'user'
  text: string
  timestamp: string
}

export interface ResumeEntry {
  id: string
  /** Role (experience), project name, or degree (education). */
  title: string
  /** Company, tech stack, or school. */
  subtitle: string
  period: string
  bullets: string[]
}

export interface ResumeData {
  name: string
  headline: string
  email: string
  phone: string
  location: string
  links: string
  summary: string
  skills: string[]
  experience: ResumeEntry[]
  projects: ResumeEntry[]
  education: ResumeEntry[]
  /** Optional Logicraft highlights (league, rank, streak) shown as achievements. */
  includeCodeQuestStats: boolean
}

export type ResumeTemplateId =
  | 'classic'
  | 'minimal'
  | 'ats'
  | 'professional'
  | 'harvard'
  | 'student'
  | 'developer'
  | 'typewriter'
  | 'compact'
  | 'elegant'
  | 'bold'
  | 'executive'

export interface ResumeTemplate {
  id: ResumeTemplateId
  name: string
  description: string
  /** XP to unlock; 0 = free. */
  cost: number
}

export interface SavedResume {
  id: string
  title: string
  templateId: ResumeTemplateId
  data: ResumeData
  updatedAt: number
}

export type JobLevel = 'Intern' | 'Junior' | 'Mid-level' | 'Senior'
export type JobEmployment = 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
export type ApplicationStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

/** Pixel logo: a sprite name on a tile in the company's colour. */
export interface JobLogoArt {
  sprite: string
  color: string
}

/** A live listing from a job board (Himalayas or Jobicy). */
export interface Job {
  id: string
  company: string
  role: string
  location: string
  workMode: 'Remote' | 'Hybrid' | 'On-site'
  employment: JobEmployment
  level: JobLevel
  salary: string | null
  postedAt: number
  postedDaysAgo: number
  logo: JobLogoArt
  summary: string
  /** Markdown. */
  description: string
  tags: string[]
  /** Course language ids the job asks for. */
  languages: string[]
  source: 'Himalayas' | 'Jobicy'
  /** The listing on the board. */
  sourceUrl: string
  /** Where Apply goes — always the board's own link. */
  applyUrl: string
}

export interface JobList {
  jobs: Job[]
  sources: { name: string; url: string }[]
  updatedAt: number | null
  /** A board couldn't be reached; older listings are shown. */
  stale: boolean
}

/** The job as it was when you applied — listings close, applications stay. */
export interface JobSnapshot {
  id: string
  role: string
  company: string
  location: string
  source: string
  applyUrl: string
  logo: JobLogoArt
}

export interface JobApplication {
  id: string
  jobId: string
  /** Missing on applications from before live listings. */
  job: JobSnapshot | null
  appliedAt: number
  /** Snapshot of the resume exactly as it was prepared. */
  resume: ResumeData
  templateId?: ResumeTemplateId
  resumeTitle?: string
  coverNote: string
  tailored: boolean
  /** Keyword match when it was tailored; null when the resume wasn't checked against the job. */
  matchScore: number | null
  /** XP spent on Quest AI help while preparing it. Applying is free. */
  xpSpent: number
  status: ApplicationStatus
  statusUpdatedAt: number | null
}

export type SqlRow = Record<string, string | number>

export interface SqlProblem {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  xp: number
  acceptanceRate: number
  tags: string[]
  description: string
  tablesUsed: string[]
  starterQuery: string
  hints: string[]
  /** Mock grader: lowercase fragments a correct query must contain, with a friendly hint for each. */
  requiredClauses: { fragment: string; hint: string }[]
  expectedColumns: string[]
  expectedRows: SqlRow[]
  successNote: string
  /** Row order matters (the problem asks for ORDER BY). */
  ordered?: boolean
  solved?: boolean
}

export type SqlProblemSummary = Pick<SqlProblem, 'id' | 'title' | 'slug' | 'difficulty' | 'xp' | 'acceptanceRate' | 'tags'> & {
  solved: boolean
}

export interface SqlQueryResult {
  columns: string[]
  rows: SqlRow[]
  executionMs: number
  truncated?: boolean
}

export interface SqlGrade {
  passed: boolean
  missingHints: string[]
  message?: string | null
}

export interface SqlRunResponse {
  result: SqlQueryResult | null
  error?: string | null
  grade?: SqlGrade | null
  awardedXp?: number | null
  balance?: XpBalance | null
}

export interface SqlTable {
  name: string
  columns: { name: string; type: string }[]
  rows: Record<string, string | number>[]
}

export type * from './api'
