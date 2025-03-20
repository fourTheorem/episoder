import type { Context } from 'aws-lambda'

export const fakeLambdaContext: Context = {
  functionName: 'test',
  callbackWaitsForEmptyEventLoop: false,
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function/test:1',
  memoryLimitInMB: '128',
  awsRequestId: '1234',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'abcd1234',
  getRemainingTimeInMillis: () => 1000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
}
