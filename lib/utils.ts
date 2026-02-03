import type { Readable } from 'node:stream'
import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import { logger } from './lambda-common'

/**
 * Convenience function for retrieving JSON from S3
 *
 * @param s3Client An AWS SDK v3 S3 Client
 * @param bucket The S3 bucket name
 * @param key The S3 object key
 * @returns The retrieved JSON as an object
 */
export async function getS3JSON<T = unknown>(s3Client: S3Client, bucket: string, key: string): Promise<T> {
  const text = await getS3Text(s3Client, bucket, key)
  return JSON.parse(text)
}

/**
 * Convenience function for retrieving text content from S3
 *
 * @param s3Client An AWS SDK v3 S3 Client
 * @param bucket The S3 bucket name
 * @param key The S3 object key
 * @returns The retrieved content as a string
 */
export async function getS3Text(s3Client: S3Client, bucket: string, key: string): Promise<string> {
  logger.info('Getting object', { bucket, key })
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  )

  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as unknown as Readable) {
    chunks.push(chunk as Uint8Array)
  }

  return Buffer.concat(chunks).toString('utf-8')
}
