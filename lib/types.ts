export interface Chapter {
  startTimestamp: number // decimal seconds
  summary: string
}

export interface Summary {
  episodeSummary: string
  chapters: Chapter[]
  tags: string[]
}

export interface TranscriptSegment {
  speakerLabel: string
  start: number
  end: number
  text: string
}

export interface Transcript {
  segments: TranscriptSegment[]
  speakers: Record<string, string>
}
