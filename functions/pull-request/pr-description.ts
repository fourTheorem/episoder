import type { Summary } from '../../lib/types'

/**
 * Convert decimal seconds to mm:ss format
 *
 * @param seconds seconds
 * @returns a string like '00:00' or '123:59'
 */
export function secondsToYtTime(seconds: number): string {
  const hours = String(Math.floor(seconds / 3600))
  const minutes = String(Math.floor((seconds % 3600) / 60))
  const roundedSeconds = String(Math.floor(seconds % 60))
  let res = ''
  if (hours !== '0') {
    res += `${hours.padStart(2, '0')}:`
  }
  res += `${minutes.padStart(2, '0')}:${roundedSeconds.padStart(2, '0')}`
  return res
}

/**
 * Create a PR markdown description from the generated summary of the episode and chapters
 */
export function createPullRequestDescription(summary: Summary): string {
  const ytChapters = summary.chapters.map((c) => `${secondsToYtTime(c.startTimestamp)} ${c.summary}`).join('\n')
  return `
# Transcript

This change includes the transcript for the podcast episode, created by [Podwhisperer](https://github.com/fourTheorem/podwhisperer).
The summary below is generated by [Episoder](https://github.com/fourTheorem/episoder).

## Episode Summary

${summary.episodeSummary}

## Suggested Chapters
${ytChapters}

## Suggested Tags
${summary.tags.join(', ')}
`
}
