# Logicraft frontend

React 19 + TypeScript + Vite app for Logicraft. All data comes from the FastAPI backend in `../backend`.

## Run it

```bash
# 1. Start the API (see ../backend/README.md) — it listens on http://localhost:8000
# 2. Then:
npm install
cp .env.example .env        # optional: VITE_API_URL defaults to http://localhost:8000/api/v1
npm run dev                 # http://localhost:5173
```

Open the app and **Create an account**. There's no demo data: everything you see comes from real players.

`npm run build` type-checks and builds; `npm run lint` runs oxlint.

## How it talks to the API

| Piece | Role |
|---|---|
| `src/services/api/client.ts` | The one `fetch` wrapper: adds `Authorization: Bearer …`, renews the session once when the access token expires, turns failures into `ApiError` with a message that's safe to show. |
| `src/services/api/index.ts` | Every endpoint as a typed function (`api.getCourses()`, `api.submitCode(…)`, …). |
| `src/services/auth.ts` | `signIn`, `signUp`, `signOut`, and `bootstrapSession` (loads the profile and wallet). |
| `src/stores/authStore.ts` | The session (tokens + profile), persisted in localStorage. |
| `src/components/auth/RequireAuth.tsx` | Guards every app route; signed-out visitors go to `/signin?next=…` and come back afterwards. |

- **Read-only data** (courses, problems, jobs, leaderboards…) uses React Query with the endpoint functions.
- **Player state the UI edits** lives in Zustand stores that mirror the server: wallet, friends and duels, resumes, applications, subscription. They call the API and keep the response.
- **XP:** the server earns and charges it. Every paid or rewarding action returns the new balance, which goes into `useWalletStore().setBalance`. The client never adjusts XP itself.
- **Resumes** save automatically, a moment after you stop typing.
- **Friends and duels** refresh every few seconds while a social page is open, because the other player acts on their own device.
- **Challenges** (`/challenges`, `/challenges/:id`, `/learn/:courseId/boss/:bossId`) are live Exercism picks. The clock is the server's deadline; the page only counts down to it. The exercise editor is the shared `components/practice/ExerciseWorkspace.tsx`.
- **Jobs** are live listings from Himalayas and Jobicy. *Apply* opens the board's own page (their terms) and adds the job to **My applications**, where the player updates its status.
- **Lessons** have a **Learn more** panel with live tutorials from DEV, Stack Overflow, MDN, Wikipedia and YouTube, served by the API's tutorial aggregator.

Pages: public `/`, `/signin`, `/signup`; everything else requires a session.
