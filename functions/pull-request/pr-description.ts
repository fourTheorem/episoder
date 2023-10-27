import { Summary } from "../lib/types";

/**
 * Convert decimal seconds to mm:ss format
 * 
 * @param seconds seconds
 * @returns a string like '00:00' or '123:59'
 */
export function secondsToYtTime (seconds: number) {
  const minutes = String(Math.floor(seconds / 60))
  const roundedSeconds = String(Math.floor(seconds % 60))
  return `${minutes.padStart(2, '0')}:${roundedSeconds.padStart(2, '0')}`
}

/**
 * Create a PR markdown description from the generated summary of the episode and chapters
 */
export function createPullRequestDescription (summary: Summary) {
  const ytChapters = summary.chapters.map(c => `${secondsToYtTime(c.startTimestamp)} ${c.summary}`).join('\n')
  return `
# Transcript
This change includes the generated transcript for the podcast episode. 

## Episode Summary

${summary.episodeSummary}

## Suggested Chapters
${ytChapters}
`
}