#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { PriceMonitorStack } from '../lib/price-monitor-stack'

const app = new cdk.App()
const bedrockRegion = app.node.tryGetContext('bedrockRegion') ?? 'us-east-1'

// eslint-disable-next-line no-new
new PriceMonitorStack(app, 'PriceMonitorStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: bedrockRegion },
  modelId: 'anthropic.claude-v2',
  bedrockRegion: 'us-east-1',
})
