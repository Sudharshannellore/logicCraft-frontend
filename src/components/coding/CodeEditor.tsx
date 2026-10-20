import { useEffect, useRef } from 'react'
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import { RotateCcw } from 'lucide-react'
import type { Language } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const languageOptions: { value: Exclude<Language, 'sql'>; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
]

const monacoLanguageMap: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  cpp: 'cpp',
  java: 'java',
  sql: 'sql',
}

export const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('logicraft-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a78bfa' },
      { token: 'string', foreground: 'ffd23f' },
      { token: 'number', foreground: '6dc9f5' },
    ],
    colors: {
      'editor.background': '#0d0f14',
      'editor.lineHighlightBackground': '#151922',
      'editorLineNumber.foreground': '#3a404c',
      'editorLineNumber.activeForeground': '#7bf542',
      'editorCursor.foreground': '#7bf542',
      'editor.selectionBackground': '#7bf54233',
      'editorIndentGuide.background1': '#1c2029',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#2e333dcc',
      'scrollbarSlider.hoverBackground': '#3c8c18cc',
      'scrollbarSlider.activeBackground': '#7bf542cc',
    },
  })
}

interface CodeEditorProps {
  language: Language
  /** Languages this problem offers; defaults to all. */
  languages?: Language[]
  value: string
  onChange: (value: string) => void
  onLanguageChange: (language: Language) => void
  onReset: () => void
  /** Bound to Ctrl/⌘+Enter inside the editor. */
  onRun?: () => void
  /** Bound to Ctrl/⌘+Shift+Enter inside the editor. */
  onSubmit?: () => void
  className?: string
}

export function CodeEditor({ language, languages, value, onChange, onLanguageChange, onReset, onRun, onSubmit, className }: CodeEditorProps) {
  // Monaco commands are registered once on mount, so they call through refs to stay current.
  const runRef = useRef(onRun)
  const submitRef = useRef(onSubmit)
  useEffect(() => {
    runRef.current = onRun
    submitRef.current = onSubmit
  }, [onRun, onSubmit])

  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => submitRef.current?.())
  }

  return (
    <div className={cn('@container flex h-full flex-col overflow-hidden bg-[#0d0f14]', className)}>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b-2 border-[var(--pixel-ink)] bg-[var(--color-surface)] px-2">
        <div className="flex items-center gap-1" role="tablist" aria-label="Language">
          {languageOptions.filter((o) => !languages || languages.includes(o.value)).map((option) => {
            const isActive = language === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onLanguageChange(option.value)}
                className={cn(
                  'px-2.5 py-1 font-pixel text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--color-accent)] text-[#06120a]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden whitespace-nowrap font-pixel text-[11px] text-[var(--color-text-muted)] @[700px]:inline">
            Ctrl+Enter run · Ctrl+Shift+Enter submit
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={onReset} title="Reset to starter code">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="logicraft-dark"
          beforeMount={defineTheme}
          onMount={handleMount}
          language={monacoLanguageMap[language]}
          value={value}
          onChange={(next) => onChange(next ?? '')}
          options={{
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 14, bottom: 14 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            renderLineHighlight: 'all',
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
            overviewRulerBorder: false,
          }}
        />
      </div>
    </div>
  )
}
