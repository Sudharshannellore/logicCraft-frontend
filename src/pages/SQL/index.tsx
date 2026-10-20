import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/services/api'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelBackdrop } from '@/components/pixel/PixelBackdrop'
import { SqlBoard } from '@/components/sql/SqlBoard'

/** Free-form SQL sandbox (no grading). Graded SQL questions live at /practice/sql/:id. */
export default function SQLSandbox() {
  const { data: tables } = useQuery({ queryKey: ['sql-tables'], queryFn: api.getSqlTables })

  if (!tables) return <PageLoader />

  return (
    <>
      <PixelBackdrop scene="vault" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/practice" className="mb-4 inline-flex items-center gap-1.5 font-pixel text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
        </Link>
        <div className="mb-6 flex items-center gap-4">
          <div className="pixel-corners flex h-14 w-14 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
            <PixelSprite sprite="database" scale={3} className="animate-pixel-hover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SQL Sandbox</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Experiment freely against the practice database — nothing here is graded.
            </p>
          </div>
        </div>
        <SqlBoard tables={tables} />
      </div>
    </>
  )
}
