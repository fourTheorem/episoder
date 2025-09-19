import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import envs from './envs'
import { createPrompt } from './prompt-template'
import type { Summary, Transcript } from './types'

const MODEL_ID = 'eu.anthropic.claude-sonnet-4-20250514-v1:0'

/**
 * Based on a Podwhisperer transcript, use the LLM to create an episode summary and chapters
 *
 * @param transcript The episode transcript
 */
export async function createSummary(
  transcript: Transcript,
  options: { bedrockRegion?: string } = {},
): Promise<Summary> {
  const { bedrockRegion } = options

  const brClient = new BedrockRuntimeClient({
    region: bedrockRegion ?? envs.BEDROCK_REGION,
  })

  const prompt = createPrompt(transcript)

  const modelInput = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 5000,
    temperature: 0.5,
    top_p: 1,
    stop_sequences: [],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  })

  const invokeModelCommand = new InvokeModelCommand({
    body: modelInput,
    modelId: MODEL_ID,
    accept: 'application/json',
    contentType: 'application/json',
  })

  const modelResponse = await brClient.send(invokeModelCommand)

  const raw = await modelResponse.body.transformToString('utf8')
  const parsed = JSON.parse(raw) as {
    content?: Array<{ type: string; text?: string }>
    stop_reason?: string
    usage?: unknown
  }

  const outputText = parsed?.content?.find((c) => c.type === 'text')?.text ?? ''

  const jsonStart = outputText.indexOf('{')
  const jsonEnd = outputText.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('Model did not return JSON content as expected.')
  }

  const jsonPart = outputText.substring(jsonStart, jsonEnd + 1)
  const summary: Summary = JSON.parse(jsonPart)

  return summary
}
