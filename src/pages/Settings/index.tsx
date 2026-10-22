import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import type { UserSettings } from '@/types'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { signOut } from '@/services/auth'
import { playSound, setSoundEnabled } from '@/services/sound'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/auth/AuthFields'
import { passwordProblem } from '@/utils/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { Sprite, SpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

function PixelToggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-8 w-[68px] shrink-0 border-2 shadow-[3px_3px_0_var(--pixel-ink)] outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
        checked
          ? 'border-[var(--pixel-ink)] bg-[var(--color-accent)]'
          : 'border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1/2 -translate-y-1/2 font-pixel text-xs leading-none',
          checked ? 'left-2 text-[#06120a]' : 'right-1.5 text-[var(--color-text-muted)]',
        )}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-[3px] h-[22px] w-[22px] border-2 border-[var(--pixel-ink)] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25),inset_3px_3px_0_rgba(255,255,255,0.5)] transition-[left] duration-150 ease-[steps(3)]',
          checked ? 'left-[39px] bg-white' : 'left-[3px] bg-[var(--color-text-muted)]',
        )}
      />
    </button>
  )
}

function SettingRow({
  sprite,
  title,
  description,
  children,
}: {
  sprite: Sprite | SpriteName
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="pixel-corners flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--color-surface-elevated)]">
          <PixelSprite sprite={sprite} scale={2} />
        </div>
        <div>
          <p className="font-pixel text-sm text-[var(--color-text-primary)]">{title}</p>
          {description && <p className="text-xs text-[var(--color-text-muted)]">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const problem = next ? passwordProblem(next) : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!current || problem) return
    setBusy(true)
    setMessage(null)
    try {
      const session = await api.changePassword(current, next)
      useAuthStore.getState().setSession(session)
      setCurrent('')
      setNext('')
      setMessage({ ok: true, text: 'Password changed. Other devices have been signed out.' })
      playSound('success')
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
      playSound('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <PasswordField label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} disabled={busy} />
      <PasswordField
        label="New password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        error={problem}
        hint="8+ characters, with a letter and a number."
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="pixel" size="sm" disabled={busy || !current || !next || !!problem}>
          {busy ? 'Saving…' : 'Change password'}
        </Button>
        {message && (
          <p role="status" className={cn('text-sm', message.ok ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]')}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: api.getSettings })
  const [saveError, setSaveError] = useState<string | null>(null)

  const toggle = async (key: keyof UserSettings, value: boolean) => {
    if (!settings) return
    setSaveError(null)
    queryClient.setQueryData(['settings'], { ...settings, [key]: value }) // show it right away
    if (key === 'soundEffects') {
      setSoundEnabled(value)
      if (value) playSound('toggleOn') // the click itself was silent, since sound was still off
    }
    try {
      queryClient.setQueryData(['settings'], await api.updateSettings({ [key]: value }))
    } catch (e) {
      queryClient.setQueryData(['settings'], settings)
      if (key === 'soundEffects') setSoundEnabled(settings.soundEffects)
      setSaveError(errorMessage(e))
      playSound('error')
    }
  }

  const leave = async () => {
    await signOut()
    navigate('/signin', { replace: true })
  }

  if (!user || !settings) return <PageLoader />

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="group pixel-corners flex h-14 w-14 shrink-0 items-center justify-center bg-[var(--color-surface-elevated)]">
          <PixelSprite sprite="gear" scale={3} className="group-hover:animate-gear-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage your account and preferences.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Avatar initials={user.avatarInitials} color={user.avatarColor} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-pixel text-lg text-[var(--color-text-primary)]">{user.username}</p>
              <p className="font-mono text-sm text-[var(--color-text-muted)]">{user.handle}</p>
              <p className="truncate text-sm text-[var(--color-text-secondary)]">{user.email}</p>
              <p className="mt-1 font-pixel text-xs text-[var(--color-accent)]">
                Lv {user.level} · {user.league.label}
              </p>
            </div>
            <Button variant="outline" data-sound="none" onClick={() => void leave()}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SettingRow sprite="scroll" title="Email notifications" description="Quest reminders and weekly recaps.">
              <PixelToggle checked={settings.emailNotifications} onChange={(v) => void toggle('emailNotifications', v)} label="Email notifications" />
            </SettingRow>
            <SettingRow sprite="star" title="Sound effects" description="XP chimes, level-up fanfares.">
              <PixelToggle checked={settings.soundEffects} onChange={(v) => void toggle('soundEffects', v)} label="Sound effects" />
            </SettingRow>
            {saveError && (
              <p role="alert" className="text-sm text-[var(--color-error)]">
                {saveError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePassword />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
