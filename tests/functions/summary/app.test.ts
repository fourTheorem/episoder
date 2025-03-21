import { Readable } from 'node:stream'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sdkStreamMixin } from '@smithy/util-stream'
import { mockClient } from 'aws-sdk-client-mock'
import { assert, type Mock, test, vi } from 'vitest'

import { handleEvent } from '../../../functions/summary/app'
import { createSummary } from '../../../lib/summarisation'
import type { Summary } from '../../../lib/types'
import { fakeLambdaContext } from '../../utils/fake-lambda-context'

const mockS3 = mockClient(S3Client)

vi.mock('../../../lib/summarisation', () => {
  const createSummary = vi.fn()
  return {
    createSummary,
  }
})

const testTranscript = {
  speakers: { spk_0: 'Eoin', spk_1: 'Luciano' },
  segments: [
    {
      speakerLabel: 'spk_0',
      start: 0,
      end: 3.66,
      text: ' We recently had a use case for creating and publishing a public Lambda function',
    },
  ],
}

const testSummary: Summary = {
  episodeSummary:
    'We discuss the options for publishing reusable AWS resources like Lambda functions. They cover approaches like GitHub, Serverless Application Repository, Terraform Modules, and more.',
  chapters: [
    { startTimestamp: 0, summary: 'Introduction' },
    { startTimestamp: 1046.38, summary: 'Conclusion and recommendations' },
  ],
  tags: ['AWS', 'Stuff', 'Things'],
}

test('summary Lambda function loads transcript and ', async () => {
  const transcriptKey = 'transcripts/999.json'
  mockS3.on(GetObjectCommand).callsFakeOnce((input) => {
    assert.equal(input.Key, transcriptKey)
    return {
      Body: sdkStreamMixin(Readable.from(Buffer.from(JSON.stringify(testTranscript)))),
    }
  })
  ;(createSummary as Mock).mockReturnValueOnce(testSummary)

  const result = await handleEvent({ transcriptKey }, fakeLambdaContext)
  assert.deepEqual(result.summary, testSummary)
})
