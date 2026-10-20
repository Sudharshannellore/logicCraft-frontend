import type {
  Achievement,
  ActivityEvent,
  AddFriendResult,
  AIMessage,
  AuthResponse,
  Billing,
  ChallengeSubmitResult,
  Course,
  DailyQuest,
  DuelActionResult,
  DuelView,
  ApplicationStatus,
  JobList,
  JobApplication,
  JobMatch,
  Language,
  LeaderboardEntry,
  Lesson,
  LessonCompletion,
  LessonResources,
  LibraryExerciseDetail,
  LibraryExerciseList,
  LibraryLanguage,
  LibraryRunResult,
  LiveChallenge,
  MentorAnswer,
  PathZone,
  PlatformStats,
  Player,
  Problem,
  ProblemSummary,
  QuestClaimResult,
  ResumeData,
  ResumeLibrary,
  ResumeTemplate,
  ResumeTemplateId,
  SavedResume,
  SocialOverview,
  SqlProblem,
  SqlProblemSummary,
  SqlRunResponse,
  SqlTable,
  StreakMilestoneStatus,
  SubmissionResult,
  SubscriptionState,
  TailorResult,
  TryItResult,
  UserProfile,
  UserSettings,
  Wallet,
  XpAward,
  XpBalance,
  XpPack,
  XpPlan,
} from '@/types'
import { http, orNull, query } from './client'

export type LeaderboardScope = 'global' | 'weekly' | 'monthly' | 'friends'

const libraryPath = (language: string) => `/library/${encodeURIComponent(language)}`
const zoneBossPath = (courseId: string, bossId: string) =>
  `/courses/${encodeURIComponent(courseId)}/bosses/${encodeURIComponent(bossId)}`

export const api = {
  // --- Auth (public) ------------------------------------------------------------------------------
  login: (email: string, password: string) => http.post<AuthResponse>('/auth/login', { email, password }, { auth: false }),
  register: (username: string, email: string, password: string) =>
    http.post<AuthResponse>('/auth/register', { username, email, password }, { auth: false }),
  logout: (refreshToken: string) => http.post<void>('/auth/logout', { refreshToken }, { auth: false }),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<AuthResponse>('/auth/change-password', { currentPassword, newPassword }),
  getStats: () => http.get<PlatformStats>('/stats', { auth: false }),
  getActivity: (limit = 12) => http.get<ActivityEvent[]>(`/activity${query({ limit })}`, { auth: false }),

  // --- Me ------------------------------------------------------------------------------------------
  getCurrentUser: () => http.get<UserProfile>('/users/me'),
  updateProfile: (patch: { username?: string; handle?: string; avatarColor?: string }) => http.patch<UserProfile>('/users/me', patch),
  getSettings: () => http.get<UserSettings>('/users/me/settings'),
  updateSettings: (patch: Partial<UserSettings>) => http.patch<UserSettings>('/users/me/settings', patch),
  getWallet: () => http.get<Wallet>('/wallet'),
  getStreakMilestones: () => http.get<StreakMilestoneStatus[]>('/rewards/streak-milestones'),
  claimStreakMilestone: (days: number) => http.post<XpAward>(`/rewards/streak-milestones/${days}/claim`),

  // --- Learn ---------------------------------------------------------------------------------------
  getCourses: () => http.get<Course[]>('/courses'),
  getCourse: (courseId: string) => orNull(http.get<Course>(`/courses/${encodeURIComponent(courseId)}`)),
  getCoursePath: (courseId: string) => http.get<PathZone[]>(`/courses/${encodeURIComponent(courseId)}/path`),
  getLesson: (lessonId: string) => orNull(http.get<Lesson>(`/lessons/${encodeURIComponent(lessonId)}`)),
  getLessonResources: (lessonId: string) => http.get<LessonResources>(`/lessons/${encodeURIComponent(lessonId)}/resources`),
  checkTryIt: (lessonId: string, code: string) => http.post<TryItResult>(`/lessons/${encodeURIComponent(lessonId)}/try-it`, { code }),
  completeLesson: (lessonId: string) => http.post<LessonCompletion>(`/lessons/${encodeURIComponent(lessonId)}/complete`),

  // --- Practice ------------------------------------------------------------------------------------
  getProblems: () => http.get<ProblemSummary[]>('/problems'),
  getProblem: (slug: string) => orNull(http.get<Problem>(`/problems/${encodeURIComponent(slug)}`)),
  runCode: (slug: string, language: Language, code: string) =>
    http.post<SubmissionResult>(`/problems/${encodeURIComponent(slug)}/run`, { language, code }),
  submitCode: (slug: string, body: { language: Language; code: string; elapsedSeconds?: number; duelId?: string }) =>
    http.post<SubmissionResult>(`/problems/${encodeURIComponent(slug)}/submit`, body),

  getSqlTables: () => http.get<SqlTable[]>('/sql/tables'),
  runSqlQuery: (sql: string) => http.post<SqlRunResponse>('/sql/query', { query: sql }),
  getSqlProblems: () => http.get<SqlProblemSummary[]>('/sql/problems'),
  getSqlProblem: (slug: string) => orNull(http.get<SqlProblem>(`/sql/problems/${encodeURIComponent(slug)}`)),
  runSqlProblem: (slug: string, sql: string) => http.post<SqlRunResponse>(`/sql/problems/${encodeURIComponent(slug)}/run`, { query: sql }),
  submitSqlProblem: (slug: string, sql: string) =>
    http.post<SqlRunResponse>(`/sql/problems/${encodeURIComponent(slug)}/submit`, { query: sql }),

  // --- Practice library (live Exercism exercises) -----------------------------------------------------
  getLibraryLanguages: () => http.get<LibraryLanguage[]>('/library/languages'),
  getLibraryExercises: (language: string) => http.get<LibraryExerciseList>(`${libraryPath(language)}/exercises`),
  getLibraryExercise: (language: string, slug: string) =>
    orNull(http.get<LibraryExerciseDetail>(`${libraryPath(language)}/exercises/${encodeURIComponent(slug)}`)),
  runLibraryExercise: (language: string, slug: string, files: Record<string, string>) =>
    http.post<LibraryRunResult>(`${libraryPath(language)}/exercises/${encodeURIComponent(slug)}/run`, { files }),
  submitLibraryExercise: (language: string, slug: string, files: Record<string, string>) =>
    http.post<LibraryRunResult>(`${libraryPath(language)}/exercises/${encodeURIComponent(slug)}/submit`, { files }),

  // --- Quest AI ------------------------------------------------------------------------------------
  getMentorIntro: () => http.get<AIMessage[]>('/mentor/intro'),
  getMentorSuggestions: (ref: { kind: 'problem' | 'lesson'; ref: string; step?: string }, limit = 20) =>
    http.get<{ suggestions: string[] }>(`/mentor/suggestions${query({ ...ref, limit })}`).then((r) => r.suggestions),
  askMentor: (
    context: { kind: 'problem'; problemSlug: string } | { kind: 'lesson'; lessonId: string; step?: string },
    question: string,
    turn: number,
  ) => http.post<MentorAnswer>('/mentor/ask', { context, question, turn }),

  // --- Challenges, quests, achievements ----------------------------------------------------------------
  getChallenges: (language: string) => http.get<LiveChallenge[]>(`/challenges${query({ language })}`),
  getChallenge: (id: string) => http.get<LiveChallenge>(`/challenges/${encodeURIComponent(id)}`),
  startChallenge: (id: string) => http.post<LiveChallenge>(`/challenges/${encodeURIComponent(id)}/start`),
  submitChallenge: (id: string, slug: string, files: Record<string, string>) =>
    http.post<ChallengeSubmitResult>(`/challenges/${encodeURIComponent(id)}/submit`, { slug, files }),
  getZoneBoss: (courseId: string, bossId: string) => http.get<LiveChallenge>(zoneBossPath(courseId, bossId)),
  startZoneBoss: (courseId: string, bossId: string) => http.post<LiveChallenge>(`${zoneBossPath(courseId, bossId)}/start`),
  submitZoneBoss: (courseId: string, bossId: string, slug: string, files: Record<string, string>) =>
    http.post<ChallengeSubmitResult>(`${zoneBossPath(courseId, bossId)}/submit`, { slug, files }),
  claimZoneBoss: (courseId: string, bossId: string) => http.post<LessonCompletion>(`${zoneBossPath(courseId, bossId)}/claim`),
  getDailyQuest: () => http.get<DailyQuest>('/quests/daily'),
  claimDailyQuest: () => http.post<QuestClaimResult>('/quests/daily/claim'),
  getAchievements: () => http.get<Achievement[]>('/achievements'),
  getLeaderboard: (scope: LeaderboardScope = 'global') => http.get<LeaderboardEntry[]>(`/leaderboard${query({ scope })}`),

  // --- Social ----------------------------------------------------------------------------------------
  getSocial: () => http.get<SocialOverview>('/social'),
  getPlayers: (limit = 50) => http.get<Player[]>(`/players${query({ limit })}`),
  sendFriendRequest: (playerId: string) =>
    http.post<{ result: AddFriendResult; overview: SocialOverview }>('/social/friend-requests', { playerId }),
  acceptFriendRequest: (playerId: string) => http.post<SocialOverview>(`/social/friend-requests/${playerId}/accept`),
  declineFriendRequest: (playerId: string) => http.post<SocialOverview>(`/social/friend-requests/${playerId}/decline`),
  removeFriend: (playerId: string) => http.delete<SocialOverview>(`/social/friends/${playerId}`),
  getDuels: () => http.get<DuelView[]>('/duels'),
  createDuel: (body: { friendId: string; problemSlug: string; timeLimitMinutes: number; stake: number }) =>
    http.post<DuelActionResult>('/duels', body),
  acceptDuel: (id: string) => http.post<DuelActionResult>(`/duels/${id}/accept`),
  declineDuel: (id: string) => http.post<DuelActionResult>(`/duels/${id}/decline`),
  cancelDuel: (id: string) => http.post<DuelActionResult>(`/duels/${id}/cancel`),
  startDuel: (id: string) => http.post<DuelView>(`/duels/${id}/start`),
  forfeitDuel: (id: string) => http.post<DuelView>(`/duels/${id}/forfeit`),

  // --- XP store ----------------------------------------------------------------------------------------
  getPlans: () => http.get<XpPlan[]>('/store/plans'),
  getPacks: () => http.get<XpPack[]>('/store/packs'),
  getSubscription: () => http.get<SubscriptionState>('/subscription'),
  subscribe: (planId: XpPlan['id'], billing: Billing) => http.post<SubscriptionState>('/subscription', { planId, billing }),
  cancelSubscription: () => http.post<SubscriptionState>('/subscription/cancel'),
  resumeSubscription: () => http.post<SubscriptionState>('/subscription/resume'),
  buyPack: (packId: string) => http.post<SubscriptionState>(`/store/packs/${packId}/purchase`),

  // --- Resumes & Resume AI -----------------------------------------------------------------------------
  getResumes: () => http.get<ResumeLibrary>('/resumes'),
  createResume: (source: 'starter' | 'duplicate') => http.post<ResumeLibrary>('/resumes', { source }),
  saveResumeData: (id: string, data: ResumeData) => http.put<SavedResume>(`/resumes/${id}/data`, data),
  patchResume: (id: string, patch: { title?: string; templateId?: ResumeTemplateId }) => http.patch<SavedResume>(`/resumes/${id}`, patch),
  activateResume: (id: string) => http.post<ResumeLibrary>(`/resumes/${id}/activate`),
  resetResume: (id: string) => http.post<SavedResume>(`/resumes/${id}/reset`),
  deleteResume: (id: string) => http.delete<ResumeLibrary>(`/resumes/${id}`),
  getResumeTemplates: () => http.get<ResumeTemplate[]>('/resume-templates'),
  unlockTemplate: (templateId: ResumeTemplateId) => http.post<ResumeLibrary>(`/resume-templates/${templateId}/unlock`),

  improveBullet: (text: string) => http.post<{ text: string; balance: XpBalance }>('/resume-ai/bullet', { text }),
  writeSummary: (data: ResumeData) => http.post<{ text: string; balance: XpBalance }>('/resume-ai/summary', { data }),
  suggestSkills: (existing: string[]) => http.post<{ skills: string[]; balance: XpBalance }>('/resume-ai/skills', { existing }),
  tailorResume: (data: ResumeData, target: { jobId: string } | { jobDescription: string }) =>
    http.post<{ result: TailorResult; tailoredData: ResumeData; balance: XpBalance }>('/resume-ai/tailor', { data, ...target }),
  writeCoverNote: (data: ResumeData, jobId: string) => http.post<{ text: string; balance: XpBalance }>('/resume-ai/cover-note', { data, jobId }),
  matchJob: (data: ResumeData, target: { jobId: string } | { jobDescription: string }) =>
    http.post<JobMatch>('/resume-ai/match', { data, ...target }),

  // --- Jobs ----------------------------------------------------------------------------------------------
  getJobs: (language?: string) => http.get<JobList>(`/jobs${query({ language })}`),
  getApplications: () => http.get<JobApplication[]>('/applications'),
  updateApplication: (id: string, status: ApplicationStatus) =>
    http.patch<JobApplication>(`/applications/${encodeURIComponent(id)}`, { status }),
  applyToJob: (
    jobId: string,
    body: { resumeId: string; resume?: ResumeData; coverNote: string; tailored: boolean; aiXpSpent: number },
  ) =>
    http.post<{ application: JobApplication; balance: XpBalance }>(`/jobs/${jobId}/applications`, body),
}
