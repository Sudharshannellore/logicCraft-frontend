import { useQuery } from '@tanstack/react-query'
import type { ResumeTemplate, ResumeTemplateId } from '@/types'
import { api } from '@/services/api'

/** The resume templates the server offers (names, descriptions, XP prices). */
export function useResumeTemplates(): ResumeTemplate[] {
  const { data } = useQuery({ queryKey: ['resume-templates'], queryFn: api.getResumeTemplates, staleTime: 60 * 60_000 })
  return data ?? []
}

/** A template's display name, falling back to a readable form of its id while the list loads. */
export function templateName(templates: ResumeTemplate[], id: ResumeTemplateId): string {
  return templates.find((t) => t.id === id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1)
}
