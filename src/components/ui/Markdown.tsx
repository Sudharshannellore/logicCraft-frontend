import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/utils/cn'

/**
 * Renders Markdown (problem statements, Exercism instructions) in the app's style. Raw HTML in the
 * source is not rendered, so third-party text can't inject markup; links open in a new tab.
 */

const components: Components = {
  h1: ({ children }) => <h2 className="mb-3 mt-6 font-pixel text-lg text-[var(--color-text-primary)] first:mt-0">{children}</h2>,
  h2: ({ children }) => <h3 className="mb-2 mt-5 font-pixel text-base text-[var(--color-text-primary)] first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-4 font-semibold text-[var(--color-text-primary)]">{children}</h4>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6 marker:text-[var(--color-accent)]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6 marker:text-[var(--color-accent)]">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-4 border-[var(--color-violet)]/60 bg-[var(--color-violet-soft)] px-4 py-2">{children}</blockquote>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={cn('font-mono', className)}>{children}</code>
    ) : (
      <code className="border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-1 py-0.5 font-mono text-[0.9em] text-[var(--color-accent)]">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="pixel-scroll mb-3 overflow-x-auto border-2 border-[var(--color-border)] bg-[#0d0f14] p-3 font-mono text-[13px] leading-6 text-[var(--color-text-primary)] [tab-size:4]">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="pixel-scroll mb-3 overflow-x-auto">
      <table className="w-full border-collapse font-mono text-[13px]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-left">{children}</th>,
  td: ({ children }) => <td className="border-2 border-[var(--color-border)] px-2 py-1">{children}</td>,
  img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" className="my-2 max-w-full bg-white/90 p-2" />,
  hr: () => <hr className="my-5 border-t-2 border-[var(--color-border)]" />,
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
