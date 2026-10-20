import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { FocusShell } from '@/components/layout/FocusShell'
import { PageLoader } from '@/components/layout/PageLoader'
import { RouteError } from '@/components/layout/RouteError'
import { GuestOnly, RequireAuth } from '@/components/auth/RequireAuth'

const Landing = lazy(() => import('@/pages/Landing'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Learn = lazy(() => import('@/pages/Learn'))
const CoursePage = lazy(() => import('@/pages/Learn/CoursePage'))
const LessonPage = lazy(() => import('@/pages/Learn/LessonPage'))
const Practice = lazy(() => import('@/pages/Practice'))
const CodeWorkspace = lazy(() => import('@/pages/Code'))
const SQLSandbox = lazy(() => import('@/pages/SQL'))
const SqlProblemPage = lazy(() => import('@/pages/Practice/SqlProblemPage'))
const ExercisePage = lazy(() => import('@/pages/Practice/ExercisePage'))
const Challenges = lazy(() => import('@/pages/Challenges'))
const ChallengePage = lazy(() => import('@/pages/Challenges/ChallengePage'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const Quests = lazy(() => import('@/pages/Quests'))
const Achievements = lazy(() => import('@/pages/Achievements'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const ResumeBuilder = lazy(() => import('@/pages/Resume'))
const JobBoard = lazy(() => import('@/pages/Jobs'))
const Subscription = lazy(() => import('@/pages/Subscription'))
const Friends = lazy(() => import('@/pages/Friends'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const SignIn = lazy(() => import('@/pages/Auth/SignIn'))
const SignUp = lazy(() => import('@/pages/Auth/SignUp'))
function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/', element: withSuspense(<Landing />), errorElement: <RouteError /> },
  { path: '/signin', element: <GuestOnly>{withSuspense(<SignIn />)}</GuestOnly>, errorElement: <RouteError /> },
  { path: '/signup', element: <GuestOnly>{withSuspense(<SignUp />)}</GuestOnly>, errorElement: <RouteError /> },
  {
    // Everything below needs a signed-in player.
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { path: '/dashboard', element: withSuspense(<Dashboard />) },
      { path: '/learn', element: withSuspense(<Learn />) },
      { path: '/learn/:courseId', element: withSuspense(<CoursePage />) },
      { path: '/learn/:courseId/:lessonId', element: withSuspense(<LessonPage />) },
      { path: '/practice', element: withSuspense(<Practice />) },
      { path: '/challenges', element: withSuspense(<Challenges />) },
      { path: '/friends', element: withSuspense(<Friends />) },
      { path: '/leaderboard', element: withSuspense(<Leaderboard />) },
      { path: '/quests', element: withSuspense(<Quests />) },
      { path: '/achievements', element: withSuspense(<Achievements />) },
      { path: '/profile', element: withSuspense(<Profile />) },
      { path: '/settings', element: withSuspense(<Settings />) },
      { path: '/resume', element: withSuspense(<ResumeBuilder />) },
      { path: '/jobs', element: withSuspense(<JobBoard />) },
      { path: '/subscription', element: withSuspense(<Subscription />) },
    ],
  },
  {
    // Play boards run full-screen without the sidebar, top bar, or mobile nav.
    element: (
      <RequireAuth>
        <FocusShell />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { path: '/practice/sql/:sqlProblemId', element: withSuspense(<SqlProblemPage />) },
      { path: '/practice/exercism/:language/:slug', element: withSuspense(<ExercisePage />) },
      { path: '/challenges/:challengeId', element: withSuspense(<ChallengePage />) },
      { path: '/learn/:courseId/boss/:bossId', element: withSuspense(<ChallengePage />) },
      { path: '/practice/:problemId', element: withSuspense(<CodeWorkspace />) },
      { path: '/code', element: withSuspense(<CodeWorkspace />) },
      { path: '/sql', element: withSuspense(<SQLSandbox />) },
    ],
  },
  { path: '*', element: withSuspense(<NotFound />), errorElement: <RouteError /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
