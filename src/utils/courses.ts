import type { Course } from '@/types'

/** Partway through: started, not finished. */
export const isContinuing = (course: Course) => course.progressPercent > 0 && course.progressPercent < 100

/** The course to resume: the one furthest along; else the first unfinished one; else (all done) the first. */
export function pickActiveCourse(courses: Course[]): Course | undefined {
  return (
    [...courses.filter(isContinuing)].sort((a, b) => b.progressPercent - a.progressPercent)[0] ??
    courses.find((c) => c.progressPercent < 100) ??
    courses[0]
  )
}
