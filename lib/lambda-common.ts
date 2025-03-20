import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer'
import middy from '@middy/core'
import type { Context } from 'aws-lambda'

// Exported powertools instances for use anywhere within a Lambda function implementation
export const logger = new Logger()
export const tracer = new Tracer()
export const metrics = new Metrics()

export type LambdaPromiseHandler<TEvent, TResult> = (event: TEvent, context: Context) => Promise<TResult>

/**
 * Create a wrapped Lambda Function handler with injected powertools logger, tracer and metrics
 *
 * @param handler The undecorated Lambda Function handler
 * @returns A 'middified' handler
 */

export const middify = <TEvent, TResult>(
  handler: LambdaPromiseHandler<TEvent, TResult>,
): LambdaPromiseHandler<TEvent, TResult> => {
  return middy<TEvent, TResult>()
    .use(injectLambdaContext(logger, { logEvent: true }))
    .use(logMetrics(metrics))
    .use(captureLambdaHandler(tracer))
    .handler(handler)
}
