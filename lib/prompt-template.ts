import { Transcript } from './types'

export function createPrompt (transcript: Transcript): string {
  return `Human: Please provide a friendly, positive episode summary (first-person plural and at least 120 words),
followed by at least 10 chapter summaries for the following podcast transcript JSON.
The transcript segments have start and end time in floating point seconds.
Include these timestamps taken exactly from the segments.
The chapter summaries should not include the speaker names.
The results should be provided as JSON with an episodeSummary property and a chapters property, which 
is an array of objects with properties "summary" and "startTimestamp".

For example, {
    "episodeSummary": "...",
    "chapters": [
        {{"startTimestamp": 0, "summary": "Introduction"}},
        {{"startTimestamp": 23.4, "summary": "Pros and cons of CloudTrail vs. third-party solutions"}},
        {{"startTimestamp": 69.1, "summary": "Using CloudTrail with Athena"}}
    ]
}
${JSON.stringify(transcript)}

Assistant:
`
}
