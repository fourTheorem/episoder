import path from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import { MetricUnits } from '@aws-lambda-powertools/metrics'

import envs from '../../lib/envs'
import { logger, metrics, middify, tracer } from '../../lib/lambda-common'
import { getS3JSON } from '../../lib/utils'
import { createSummary } from '../../lib/summarisation'
import { Summary, Transcript } from '../../lib/types'

const { BUCKET_NAME } = envs

const s3Client = new S3Client({})

interface SummarisationEvent {
  transcriptKey: string
}

interface SummarisationResponse {
  summary: Summary
}
/**
 * Lambda Function handler to create an episode summary and chapters from a transcript
 */
export const handleEvent = middify(async (event: SummarisationEvent): Promise<SummarisationResponse> => {
  const { transcriptKey } = event
  const id = path.basename(event.transcriptKey).split('.')[0]
  tracer.putAnnotation('id', id)
  tracer.putMetadata('transcriptKey', transcriptKey)

  logger.info('Summarising transcript', { id, transcriptKey })
  const transcript: Transcript = await getS3JSON(s3Client, BUCKET_NAME, event.transcriptKey)
  metrics.addMetric('SegmentCount', MetricUnits.Count, transcript.segments.length)
  const summary = await createSummary(transcript)
  metrics.addMetric('EpisodeSummaryLength', MetricUnits.Count, summary.episodeSummary.length)
  metrics.addMetric('ChapterCount', MetricUnits.Count, summary.chapters.length)

  return {
    summary
  }
})
