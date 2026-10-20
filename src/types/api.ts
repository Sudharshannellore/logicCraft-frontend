/** Types that exist because the app now talks to the Logicraft API (auth, wallet, social, store…). */
import type { AIMessage, DailyQuest, Difficulty, ResumeTemplateId, SavedResume, UserProfile } from './index'

// --- Auth & wallet ----------------------------------------------------------------------------------

export interface TokenPair {
  accessToken: string
  refreshToken: string
  tokenType: string
  /** Epoch ms. */
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

export interface AuthResponse {
  tokens: TokenPair
  user: UserProfile
}

export interface XpBalance {
  xp: number
  lifetimeXp: number
}

export interface XpAward {
  awarded: number
  balance: XpBalance
}

export interface Wallet extends XpBalance {
  rewarded: string[]
  claimedMilestones: number[]
}

export interface StreakMilestoneStatus {
  days: number
  xp: number
  claimed: boolean
  claimable: boolean
}

export interface UserSettings {
  emailNotifications: boolean
  soundEffects: boolean
}

// --- Learning extras -------------------------------------------------------------------------------

export interface LessonCompletion {
  lessonId: string
  awarded: number
  balance: XpBalance
  courseProgressPercent: number
}

export interface TryItResult {
  passed: boolean
  hints: string[]
  expectedOutput: string
}

export interface TutorialResource {
  id: string
  provider: string
  kind: 'article' | 'video' | 'qa' | 'reference'
  title: string
  url: string
  summary?: string | null
  author?: string | null
  thumbnailUrl?: string | null
  tags: string[]
  score: number
  readingMinutes?: number | null
}

export interface TutorialReference {
  provider: string
  title: string
  summary: string
  url: string
  thumbnailUrl?: string | null
}

export interface LessonResources {
  lessonId: string
  reference: TutorialReference | null
  resources: TutorialResource[]
}

export interface QuestClaimResult {
  quest: DailyQuest
  awarded: number
  balance: XpBalance
}

export interface ActivityEvent {
  id: string
  sprite: string
  player: string
  action: string
  xp: number
}

export interface MentorAnswer {
  question: AIMessage
  answer: AIMessage
  cost: number
  balance: XpBalance
}

// --- Social ------------------------------------------------------------------------------------------

/** Another player, as the Friends page sees them. */
export interface Player {
  id: string
  username: string
  avatarColor: string
  avatarInitials: string
  level: number
  league: string
  online: boolean
}

export type AddFriendResult = 'sent' | 'invalid' | 'self' | 'not-found' | 'already-friends' | 'already-sent' | 'accepted-incoming'

export interface FriendRequest {
  playerId: string
  player: Player
  at: number
}

export interface SocialOverview {
  myId: string
  friends: Player[]
  incomingRequests: FriendRequest[]
  outgoingRequests: FriendRequest[]
}

export type DuelStatus = 'pending' | 'active' | 'won' | 'lost' | 'draw' | 'declined' | 'cancelled'

/** A duel exactly as the server sends it, from my point of view. */
export interface DuelView {
  id: string
  friendId: string
  friend?: Player | null
  problemSlug: string
  timeLimitMinutes: number
  stake: number
  direction: 'sent' | 'received'
  createdAt: number
  startedAt?: number | null
  finishedAt?: number | null
  /** null while unfinished or when I ran out of time — check `myFinished`. */
  mySeconds?: number | null
  myFinished: boolean
  /** Hidden (null) until my own result is in. */
  friendSeconds: number | null
  status: DuelStatus
}

export interface DuelActionResult {
  duel: DuelView
  balance: XpBalance
}

// --- Store & resumes --------------------------------------------------------------------------------

export type Billing = 'monthly' | 'yearly'

export interface XpPlan {
  id: 'starter' | 'pro' | 'elite'
  name: string
  monthlyXp: number
  price: Record<Billing, number>
  perks: string[]
  sprite: 'potion' | 'gem' | 'crown'
  popular?: boolean
}

export interface XpPack {
  id: string
  xp: number
  bonusPercent: number
  price: number
}

export interface Subscription {
  planId: XpPlan['id']
  billing: Billing
  nextDropAt: number
  periodEndsAt: number
  cancelAtPeriodEnd: boolean
}

export interface Purchase {
  id: string
  label: string
  xp: number
  price: number
  at: number
}

export interface SubscriptionState {
  subscription: Subscription | null
  purchases: Purchase[]
  balance: XpBalance
}

export interface ResumeLibrary {
  resumes: SavedResume[]
  activeId: string
  extraSlots: number
  slotCount: number
  maxResumes: number
  slotCost: number
  unlockedTemplates: ResumeTemplateId[]
  balance: XpBalance
}

export interface JobMatch {
  score: number
  matched: string[]
  missing: string[]
}

export interface TailorResult extends JobMatch {
  summary: string
}

// --- Practice library (live Exercism exercises) -----------------------------------------------------

export interface LibraryLanguage {
  id: string
  name: string
  /** The language's Exercism track. */
  track: string
  /** True when this server runs the tests; otherwise the exercise is solved on exercism.org. */
  gradable: boolean
  exerciseCount: number | null
  solved: number
}

export interface LibraryExercise {
  slug: string
  name: string
  difficulty: Difficulty
  /** Exercism's own 1–10 scale. */
  level: number
  xp: number
  topics: string[]
  solved: boolean
}

export interface LibraryExerciseList {
  language: LibraryLanguage
  exercises: LibraryExercise[]
  sourceUrl: string
  license: string
}

export interface LibraryExerciseDetail {
  language: LibraryLanguage
  slug: string
  name: string
  blurb: string
  difficulty: Difficulty
  level: number
  xp: number
  topics: string[]
  /** Markdown from Exercism. */
  instructions: string
  /** Files the learner edits (name → starter code). */
  solution: Record<string, string>
  /** The test suite the solution is graded against. */
  tests: Record<string, string>
  solved: boolean
  exercismUrl: string
  source?: string | null
  sourceUrl?: string | null
}

export interface LibraryTestResult {
  name: string
  status: 'pass' | 'fail' | 'error'
  message?: string | null
}

export interface LibraryRunResult {
  status: 'passed' | 'failed' | 'error'
  tests: LibraryTestResult[]
  passedCount: number
  total: number
  stdout: string
  error?: string | null
  runtimeMs?: number | null
  awardedXp?: number | null
  balance?: XpBalance | null
}

/** Live platform counts for the landing page. */
export interface PlatformStats {
  learners: number
  problemsSolved: number
  bossesDefeated: number
  languages: number
}

// --- Live challenges (Exercism) --------------------------------------------------------------------

export type ChallengeKind = 'daily' | 'speed' | 'boss' | 'zone'
export type ChallengeStatus = 'not_started' | 'in_progress' | 'won' | 'timed_out' | 'ended'

export interface ChallengeStage {
  slug: string
  name: string
  difficulty: Difficulty
  level: number
  topics: string[]
  cleared: boolean
  exercismUrl: string
}

export interface ChallengeRunner {
  rank: number
  playerId: string
  username: string
  avatarColor: string
  avatarInitials: string
  seconds: number
  isYou: boolean
}

export interface LiveChallenge {
  id: string
  kind: ChallengeKind
  title: string
  description: string
  language: string
  languageName: string
  /** False: the tests run on exercism.org, so the challenge isn't timed and pays no bonus. */
  gradable: boolean
  period: string | null
  startsAt: number | null
  /** When it rotates out (epoch ms). Zone bosses don't rotate. */
  endsAt: number | null
  timeLimitMinutes: number
  bonusXp: number
  bossName: string | null
  bossSprite: string | null
  courseId: string | null
  bossId: string | null
  /** Zone bosses: topics in the zone are still uncleared. */
  locked: boolean
  stages: ChallengeStage[]
  players: number
  winners: number
  fastest: ChallengeRunner[]
  me: {
    status: ChallengeStatus
    startedAt: number | null
    deadline: number | null
    /** Solve time once won. */
    seconds: number | null
    tries: number
  }
  sourceUrl: string
}

export interface ChallengeSubmitResult {
  result: LibraryRunResult
  challenge: LiveChallenge
  won: boolean
  /** The challenge bonus, on top of the exercise's own first-solve XP (result.awardedXp). */
  bonusXp: number
  balance: XpBalance
}
