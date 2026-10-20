/**
 * Quest AI helpers that run in the browser. Suggestions and answers come from the API
 * (`/mentor/suggestions`, `/mentor/ask`); this only filters suggestions as the learner types, so the
 * list reacts on every keystroke without a request.
 */

const words = (text: string) => text.toLowerCase().match(/[a-z0-9+#]+/g) ?? []

/** Levenshtein distance, capped early — only used to forgive one-letter typos. */
function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return 2
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

/** Does a typed token match a word — as a prefix while typing, or with one typo for longer words? */
function tokenMatches(token: string, word: string) {
  if (word.startsWith(token)) return true
  if (token.length >= 4 && editDistance(token, word.slice(0, token.length)) <= 1) return true
  return token.length >= 4 && editDistance(token, word) <= 1
}

/** Suggestions related to what's being typed, best match first. */
export function matchSuggestions(pool: string[], input: string, limit = 4): string[] {
  const tokens = words(input).filter((t) => t.length >= 2)
  if (!tokens.length) return pool.slice(0, limit)
  return pool
    .map((q) => {
      const qWords = words(q)
      const score = tokens.filter((t) => qWords.some((w) => tokenMatches(t, w))).length
      return { q, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.q)
}
