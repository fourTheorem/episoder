import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import envs from './envs'
import { createPrompt } from './prompt-template'
import type { Summary, Transcript } from './types'

const MODEL_ID = 'anthropic.claude-v2'

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
    region: bedrockRegion === undefined ? envs.BEDROCK_REGION : bedrockRegion,
  })

  const prompt = createPrompt(transcript)
  const modelInput = JSON.stringify({
    prompt,
    max_tokens_to_sample: 5000,
    temperature: 0.5,
    top_k: 250,
    top_p: 1,
    stop_sequences: [],
  })

  const invokeModelCommand = new InvokeModelCommand({
    body: modelInput,
    modelId: MODEL_ID,
    accept: 'application/json',
    contentType: 'application/json',
  })

  const modelResponse = await brClient.send(invokeModelCommand)
  const { completion } = JSON.parse(modelResponse.body.transformToString('utf8'))
  const jsonStart: number = completion.indexOf('{')
  const jsonEnd: number = completion.lastIndexOf('}')
  const jsonPart = completion.substring(jsonStart, jsonEnd + 1)
  const summary = JSON.parse(jsonPart)
  return summary
}
