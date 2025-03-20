import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as PriceMonitor from '../lib/price-monitor-stack'

test('Dashboard Created', () => {
  const app = new cdk.App()
  const stack = new PriceMonitor.PriceMonitorStack(app, 'MyTestStack', {
    bedrockRegion: 'us-west-2',
    modelId: 'anthropic.claude-v2',
  })

  const template = Template.fromStack(stack)

  template.hasResourceProperties('AWS::CloudWatch::Dashboard', {})
})
