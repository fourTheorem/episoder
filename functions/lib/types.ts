export interface Chapter {
  startTimestamp: number, // decimal seconds
  summary: string
}

export interface Summary {
  episodeSummary: string,
  chapters: Chapter[]
}