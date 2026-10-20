import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

interface QuizCardProps {
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  onResult?: (correct: boolean) => void
  className?: string
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuizCard({ question, options, correctIndex, explanation, onResult, className }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const isCorrect = checked && selected === correctIndex

  const check = () => {
    if (selected === null) return
    setChecked(true)
    onResult?.(selected === correctIndex)
  }

  const retry = () => {
    setSelected(null)
    setChecked(false)
  }

  return (
    <div className={className}>
      <p className="text-lg font-medium text-[var(--color-text-primary)]">{question}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={question}>
        {options.map((option, index) => {
          const isSelected = selected === index
          const showCorrect = checked && index === correctIndex
          const showWrong = checked && isSelected && index !== correctIndex
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={checked}
              onClick={() => setSelected(index)}
              className={cn(
                'group flex items-center gap-3 border-2 p-3 text-left transition-[border-color,background-color,transform] duration-100 disabled:cursor-default',
                !checked && 'hover:-translate-y-0.5 hover:border-[var(--color-accent)]/60',
                isSelected && !checked && 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[3px_3px_0_var(--pixel-ink)]',
                !isSelected && !checked && 'border-[var(--color-border-strong)] bg-[var(--color-bg)]',
                showCorrect && 'border-[var(--color-success)] bg-[var(--color-success)]/10',
                showWrong && 'border-[var(--color-error)] bg-[var(--color-error)]/10',
                checked && !showCorrect && !showWrong && 'border-[var(--color-border)] bg-[var(--color-bg)] opacity-60',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center font-pixel text-sm',
                  showCorrect
                    ? 'bg-[var(--color-success)] text-[#06120a]'
                    : showWrong
                      ? 'bg-[var(--color-error)] text-[#1a0505]'
                      : isSelected
                        ? 'bg-[var(--color-accent)] text-[#06120a]'
                        : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]',
                )}
              >
                {showCorrect ? <Check className="h-4 w-4" strokeWidth={3} /> : showWrong ? <X className="h-4 w-4" strokeWidth={3} /> : LETTERS[index]}
              </span>
              <span className="font-mono text-[15px] text-[var(--color-text-primary)]">{option}</span>
            </button>
          )
        })}
      </div>

      {checked ? (
        <div
          role="status"
          className={cn(
            'mt-5 flex flex-col gap-3 border-2 p-4 sm:flex-row sm:items-center',
            isCorrect ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10' : 'border-[var(--color-error)]/40 bg-[var(--color-error)]/10',
          )}
        >
          <PixelSprite sprite={isCorrect ? 'star' : 'bugSlime'} scale={2.5} fps={3} className="shrink-0" />
          <div className="flex-1">
            <p className={cn('font-pixel', isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]')}>
              {isCorrect ? 'Correct!' : 'Not quite.'}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isCorrect ? explanation ?? 'Nicely done.' : 'Have another look at the visual and try again.'}
            </p>
          </div>
          {!isCorrect && (
            <Button variant="secondary" size="sm" onClick={retry}>
              Try again
            </Button>
          )}
        </div>
      ) : (
        <Button className="mt-5 w-full sm:w-auto" disabled={selected === null} onClick={check}>
          Check answer
        </Button>
      )}
    </div>
  )
}
