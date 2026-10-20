/** Renders `backtick` spans in plain problem text as inline code. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} className="border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-1 font-mono text-[0.9em] text-[var(--color-accent)]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
