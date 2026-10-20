import { useEffect, useRef, useState } from 'react'
import type { ResumeData, ResumeTemplateId } from '@/types'
import { ResumePreview } from './ResumePreview'
import { cn } from '@/utils/cn'

/** A4 at 96dpi — the paper is laid out at print size and scaled down to fit its column. */
const PAPER_WIDTH = 794

interface ScaledResumeProps {
  data: ResumeData
  template?: ResumeTemplateId
  className?: string
  paperClassName?: string
}

export function ScaledResume({ data, template, className, paperClassName }: ScaledResumeProps) {
  const col = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 1, height: 0 })

  useEffect(() => {
    const box = col.current
    const sheet = paper.current
    if (!box || !sheet) return
    const measure = () => {
      const scale = Math.min(1, box.clientWidth / PAPER_WIDTH)
      setFit({ scale, height: sheet.offsetHeight * scale })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    ro.observe(sheet)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={col} className={cn('overflow-hidden', className)} style={{ height: fit.height || undefined }}>
      <div ref={paper} className="origin-top-left" style={{ width: PAPER_WIDTH, transform: `scale(${fit.scale})` }}>
        <ResumePreview data={data} template={template} className={paperClassName} />
      </div>
    </div>
  )
}
