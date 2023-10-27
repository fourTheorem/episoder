import path from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'

import envs from '../lib/envs'
import { logger, middify } from '../lib/lambda-common'
import { getS3JSON } from '../lib/utils'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const MODEL_ID = 'anthropic.claude-v2'

const { BUCKET_NAME } = envs

const s3Client = new S3Client({})
const brClient = new BedrockRuntimeClient({ region: envs.BEDROCK_REGION })

type SummarisationEvent = {
  transcriptKey: string
}

/**
 * Lambda Function handler to create an episode summary and chapters from a transcript
 */
export const handleEvent = middify(async (event: SummarisationEvent) => {
  const { transcriptKey } = event
  const id = path.basename(event.transcriptKey).split('.')[0]

  logger.info('Summarising transcript', { id, transcriptKey })
  const transcript = await getS3JSON(s3Client, BUCKET_NAME, event.transcriptKey)

  const prompt = `Human: Please provide a friendly, positive episode summary (first-person plural and at least 120 words),
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
  const modelInput = JSON.stringify({
    prompt: prompt,
    max_tokens_to_sample: 5000,
    temperature: 0.5,
    top_k: 250,
    top_p: 1,
    stop_sequences: []
  })

  const invokeModelCommand = new InvokeModelCommand({
    body: modelInput,
    modelId: MODEL_ID,
    accept: 'application/json',
    contentType: 'application/json'
  })

  const modelResponse = await brClient.send(invokeModelCommand)
  const { completion } = JSON.parse(modelResponse.body.transformToString('utf8'))
  const jsonStart = completion.indexOf('{')
  const jsonEnd = completion.lastIndexOf('}')
  const jsonPart = completion.substring(jsonStart, jsonEnd + 1)
  const summary = JSON.parse(jsonPart)

  return {
    summary
  }
  
})