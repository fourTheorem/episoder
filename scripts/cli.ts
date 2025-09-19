import type { Context } from 'aws-lambda'
import { handleEvent } from '../functions/pull-request/app'

const context: Context = {
  awsRequestId: '123',
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
  logGroupName: '/aws/lambda/test',
  logStreamName: '2021/07/15/[$LATEST]12345678901234567890',
  memoryLimitInMB: '128',
  getRemainingTimeInMillis: () => 1000000,
  done: (): void => {},
  fail: (): void => {},
  succeed: (): void => {},
}

async function go() {
  const event = {
    summary: {
      episodeSummary:
        'In this episode, we provide an overview of AWS Step Functions and dive deep into the powerful new JSONata and variables features. We explain how JSONata allows complex JSON transformations without custom Lambda functions, enabling more serverless workflows. The variables feature also helps avoid the previous 256KB state size limit. We share examples from real projects showing how these features simplify workflows, reduce costs and enable new use cases.',
      chapters: [
        { startTimestamp: 0, summary: 'Introduction and recap of step functions' },
        { startTimestamp: 55.96, summary: 'Overview of what step functions are and key capabilities' },
        { startTimestamp: 391.06, summary: 'Explanation of standard vs. express workflows' },
        { startTimestamp: 398.66, summary: 'Introducing the new JSONata support' },
        { startTimestamp: 686.3, summary: 'Overview of the new variables feature' },
        { startTimestamp: 849.22, summary: 'Discussion of pricing and potential benefits' },
      ],
      tags: [
        'AWS',
        'Step Functions',
        'Serverless',
        'Workflow',
        'Orchestration',
        'JSONata',
        'Variables',
        'State Machine',
        'ASL',
        'CDK',
        'Lambda',
        'ETL',
        'Data Processing',
        'Data Transformation',
        'JSON',
        'Developer Experience',
        'Cost Optimization',
      ],
    },
    transcriptKey: 'processed-transcripts/141.json',
  }

  await handleEvent(event, context)
}

go()
