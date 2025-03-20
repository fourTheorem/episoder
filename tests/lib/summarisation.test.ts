import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream'
import { mockClient } from 'aws-sdk-client-mock'
import { assert, test } from 'vitest'
import { createSummary } from '../../lib/summarisation'

const mockBedrockRuntime = mockClient(BedrockRuntimeClient)

const testTranscript = {
  speakers: { spk_0: 'Eoin', spk_1: 'Luciano' },
  segments: [
    {
      speakerLabel: 'spk_0',
      start: 0,
      end: 3.66,
      text: ' We recently had a use case for creating and publishing a public Lambda function',
    },
    {
      speakerLabel: 'spk_0',
      start: 3.8200000000000003,
      end: 6.32,
      text: ' so other AWS users could make use of it.',
    },
    {
      speakerLabel: 'spk_0',
      start: 6.5,
      end: 8.22,
      text: ' This gave us an interesting challenge.',
    },
    {
      speakerLabel: 'spk_0',
      start: 8.4,
      end: 12.06,
      text: ' This is the end.',
    },
  ],
}

for (const bedrockRegion of [undefined, 'eu-central-1']) {
  test('createSummary extracts summary from the LLM completion', async () => {
    const summary = {
      episodeSummary:
        'We discuss the options for publishing reusable AWS resources like Lambda functions. They cover approaches like GitHub, Serverless Application Repository, Terraform Modules, and more.',
      chapters: [
        { startTimestamp: 0, summary: 'Introduction' },
        { startTimestamp: 23.36, summary: 'Describing the use case that led to wanting to publish a Lambda function' },
        { startTimestamp: 169.14, summary: 'Pros and cons of using the Serverless Application Repository' },
        { startTimestamp: 835.4, summary: 'Avoiding data transfer costs with public S3 buckets' },
        { startTimestamp: 883.46, summary: 'Challenges using Requester Pays with Lambda' },
        { startTimestamp: 945.6, summary: 'Monetizing solutions on the AWS Marketplace' },
        { startTimestamp: 1046.38, summary: 'Conclusion and recommendations' },
      ],
    }

    mockBedrockRuntime.on(InvokeModelCommand).callsFake((input) => {
      assert.ok(input.modelId)
      assert.ok(input.accept)
      assert.ok(input.contentType)
      const parsedBody = JSON.parse(input.body)
      const { prompt } = parsedBody
      assert.match(prompt, /^Human: .*\n.*\n.*Assistant:\n$/s)

      const completion = `
      Here is the response. I hope you like it
      
      ${JSON.stringify(summary)}

      Done!`
      const body = Uint8ArrayBlobAdapter.fromString(
        JSON.stringify({
          completion,
          stop_reason: 'stop_sequence',
        }),
      )

      return {
        body,
      }
    })

    const generatedSummary = await createSummary(testTranscript, { bedrockRegion })
    assert.deepEqual(generatedSummary, summary)
  })
}
