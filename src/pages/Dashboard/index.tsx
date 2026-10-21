import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Trophy, Target, TrendingUp } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { XPBar } from '@/components/gamification/XPBar'
import { StreakCard } from '@/components/gamification/StreakCard'
import { LeagueBadge } from '@/components/gamification/LeagueBadge'
import { QuestCard } from '@/components/gamification/QuestCard'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { useWalletStore } from '@/stores/walletStore'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import { pickActiveCourse } from '@/utils/courses'
import { PathSprite } from '@/components/learning/PathCard'

export default function Dashboard() {
  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: api.getCurrentUser })
  const lifetimeXp = useWalletStore((s) => s.lifetimeXp)
  const { data: quest } = useQuery({ queryKey: ['daily-quest'], queryFn: api.getDailyQuest })
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: api.getCourses })
  const { data: paths } = useQuery({ queryKey: ['paths'], queryFn: api.getPaths })
  const { data: leaderboard } = useQuery({ queryKey: ['leaderboard', 'global'], queryFn: () => api.getLeaderboard('global') })

  const activeCourse = courses ? pickActiveCourse(courses) : undefined
  const { data: activePath } = useQuery({
    queryKey: ['course-path', activeCourse?.id],
    queryFn: () => api.getCoursePath(activeCourse?.id ?? ''),
    enabled: Boolean(activeCourse),
  })

  if (!user || !quest || !courses || !leaderboard) return <PageLoader />

  // Resume at the topic the map says is next; a finished course revisits its last topic.
  const topics = (activePath ?? []).flatMap((zone) => zone.nodes)
  const nextTopic = topics.find((n) => n.state === 'current') ?? topics[topics.length - 1]
  const courseHref = activeCourse ? (nextTopic ? `/learn/${activeCourse.id}/${nextTopic.lessonId}` : `/learn/${activeCourse.id}`) : '/learn'
  // The path to show: one the player follows, else the best suggestion.
  const careerPath = paths?.find((p) => p.enrolled && p.progressPercent < 100) ?? paths?.find((p) => p.recommended)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const topFive = leaderboard.slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {user.username} 👋</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Here's where your quest stands today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StreakCard days={user.streakDays} />
          <LeagueBadge league={user.league} />
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-2">
        <div className="flex flex-col sm:flex-row">
          <div className="relative flex h-36 shrink-0 items-end justify-center overflow-hidden bg-[linear-gradient(180deg,#08090b_0%,#1a1130_100%)] sm:h-auto sm:w-48">
            {[
              [12, 14],
              [30, 40],
              [70, 22],
              [84, 52],
              [52, 10],
              [20, 62],
            ].map(([x, y], i) => (
              <span
                key={i}
                className="animate-pixel-twinkle absolute h-1 w-1 bg-white"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.27}s` }}
              />
            ))}
            <div className="relative z-10 flex flex-col items-center">
              <PixelSprite sprite="hero" scale={5} className="animate-pixel-bob" title={`${user.username}'s avatar`} />
              <div className="h-1.5 w-40 bg-[var(--color-accent)]" />
              <div className="h-3 w-40 bg-[#3c8c18]" />
            </div>
          </div>
          <CardContent className="flex flex-1 flex-col justify-center gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-pixel text-2xl">
                Level <span className="text-[var(--color-accent)]">{user.level}</span>
              </p>
              <p className="font-pixel text-sm text-[var(--color-text-muted)]">Rank #{user.rank} global</p>
            </div>
            <XPBar xp={lifetimeXp} xpToNextLevel={user.xpToNextLevel} />
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-pixel text-[var(--color-accent)]">{Math.max(0, user.xpToNextLevel - lifetimeXp).toLocaleString()} XP</span> to Level{' '}
              {user.level + 1}.
            </p>
          </CardContent>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuestCard quest={quest} />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{activeCourse && activeCourse.progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}</CardTitle>
              <Link to={activeCourse ? `/learn/${activeCourse.id}` : '/learn'} className="text-sm font-medium text-[var(--color-accent)] hover:underline">
                {activeCourse ? 'View course' : 'Browse courses'}
              </Link>
            </CardHeader>
            <CardContent>
              {activeCourse ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{activeCourse.title}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{activeCourse.world}</p>
                    </div>
                    <span className="font-mono text-sm text-[var(--color-accent)]">{activeCourse.progressPercent}%</span>
                  </div>
                  <ProgressBar percent={activeCourse.progressPercent} className="mt-3" />
                  {nextTopic && (
                    <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                      {nextTopic.state === 'current' ? 'Up next' : 'Last topic'}: <span className="text-[var(--color-text-primary)]">{nextTopic.title}</span>
                    </p>
                  )}
                  <Link to={courseHref} className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4 w-full sm:w-auto')}>
                    {activeCourse.progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Courses couldn't be loaded right now. Check back in a minute, or head to the <Link to="/learn" className="text-[var(--color-accent)] hover:underline">Learn page</Link>.
                </p>
              )}
            </CardContent>
          </Card>

          {paths && paths.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{careerPath ? (careerPath.enrolled ? 'Your career path' : 'Suggested career path') : 'Career paths'}</CardTitle>
                <Link to="/paths" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
                  All paths
                </Link>
              </CardHeader>
              <CardContent>
                {careerPath ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{careerPath.title}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">{careerPath.reason ?? careerPath.tagline}</p>
                      </div>
                      <PathSprite name={careerPath.sprite} scale={3} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-muted)]">
                        {careerPath.completedSteps} of {careerPath.totalSteps} courses done
                      </span>
                      <span className="font-mono text-[var(--color-accent)]">{careerPath.progressPercent}%</span>
                    </div>
                    <ProgressBar percent={careerPath.progressPercent} className="mt-1.5" />
                    <Link to={`/paths/${careerPath.id}`} className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4 w-full sm:w-auto')}>
                      Open path
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Pick an industry route (full-stack, AI, data and more) and follow it course by course.
                    </p>
                    <Link to="/paths" className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4 w-full sm:w-auto')}>
                      Explore career paths
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-[var(--color-accent)]" /> Top of the League
              </CardTitle>
              <Link to="/leaderboard" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
                See all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {topFive.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    'flex items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm',
                    entry.isCurrentUser && 'bg-[var(--color-accent-soft)]',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 font-mono text-xs text-[var(--color-text-muted)]">#{entry.rank}</span>
                    <Avatar initials={entry.avatarInitials} color={entry.avatarColor} size="sm" />

                    <span className={cn('font-medium', entry.isCurrentUser && 'text-[var(--color-accent)]')}>{entry.username}</span>
                  </div>
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">{entry.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-[var(--color-violet)]" /> Recommended Next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/practice/two-sum" className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm hover:border-[var(--color-accent)]">
                <span className="flex items-center gap-2.5">
                  <PixelSprite sprite="terminal" scale={2} /> Two Sum
                </span>
                <Badge variant="success">Easy</Badge>
              </Link>
              <Link to="/challenges" className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm hover:border-[var(--color-accent)]">
                <span className="flex items-center gap-2.5">
                  <PixelSprite sprite="recursionBoss" scale={1} fps={3} /> This week's boss
                </span>
                <Badge variant="error">Boss</Badge>
              </Link>
              <Link to="/practice/sql/department-averages" className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm hover:border-[var(--color-accent)]">
                <span className="flex items-center gap-2.5">
                  <PixelSprite sprite="database" scale={2} /> Department Averages
                </span>
                <Badge variant="info">SQL</Badge>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                You've solved <span className="font-semibold text-[var(--color-text-primary)]">{user.stats.problemsSolved}</span> problems
                with <span className="font-semibold text-[var(--color-text-primary)]">{user.stats.accuracy}%</span> accuracy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
