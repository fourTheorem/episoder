import { Readable } from 'stream'
import { mockClient } from 'aws-sdk-client-mock'
import { sdkStreamMixin } from '@aws-sdk/util-stream-node'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { test, assert } from 'vitest'

process.env.BUCKET_NAME = 'test-bucket'
import { handleEvent } from '../../../functions/summary/app'
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream'

const mockS3 = mockClient(S3Client)
const mockBedrockRuntime = mockClient(BedrockRuntimeClient)

const testTranscript = {
  'speakers': { 'spk_0': 'Eoin', 'spk_1': 'Luciano' },
  'segments': [{
    'speakerLabel': 'spk_0',
    'start': 0,
    'end': 3.66,
    'text': ' We recently had a use case for creating and publishing a public Lambda function'
  },
  {
    'speakerLabel': 'spk_0',
    'start': 3.8200000000000003,
    'end': 6.32,
    'text': ' so other AWS users could make use of it.'
  },
  {
    'speakerLabel': 'spk_0',
    'start': 6.5,
    'end': 8.22,
    'text': ' This gave us an interesting challenge.'
  },
  {
    'speakerLabel': 'spk_0',
    'start': 8.4,
    'end': 12.06,
    'text': ' This is the end.'
  }]
}

test(`summary Lambda function extracts summary from the LLM completion`, async () => {
  const transcriptKey = 'transcripts/999.json'
  const summary = {
    "episodeSummary": "We discuss the options for publishing reusable AWS resources like Lambda functions. They cover approaches like GitHub, Serverless Application Repository, Terraform Modules, and more.",
    "chapters": [
        {"start_timestamp": 0, "summary": "Introduction"},
        {"start_timestamp": 23.36, "summary": "Describing the use case that led to wanting to publish a Lambda function"}, 
        {"start_timestamp": 169.14, "summary": "Pros and cons of using the Serverless Application Repository"},
        {"start_timestamp": 835.4, "summary": "Avoiding data transfer costs with public S3 buckets"},
        {"start_timestamp": 883.46, "summary": "Challenges using Requester Pays with Lambda"},
        {"start_timestamp": 945.6, "summary": "Monetizing solutions on the AWS Marketplace"},
        {"start_timestamp": 1046.38, "summary": "Conclusion and recommendations"}
    ]
  } 

  mockS3.on(GetObjectCommand).callsFakeOnce((input) => {
    assert.equal(input.Key, transcriptKey)
    return { 
      Body: sdkStreamMixin(Readable.from(Buffer.from(JSON.stringify(testTranscript))))
    }
  })

  mockBedrockRuntime.on(InvokeModelCommand).callsFakeOnce((input) => {
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
    const body = Uint8ArrayBlobAdapter.fromString(JSON.stringify({
      completion,
      stop_reason: 'stop_sequence'
    }))

    return {
      body
    }
  })

  const result = await handleEvent({ transcriptKey })
  assert.deepEqual(result.summary, summary)
})