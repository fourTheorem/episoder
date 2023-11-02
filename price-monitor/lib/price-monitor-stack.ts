/* eslint-disable no-new */
import * as cdk from 'aws-cdk-lib'
import { } from '@aws-sdk/client-pricing'
import { Construct } from 'constructs'

import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'

const BEDROCK_METRIC_NAMESPACE = 'AWS/Bedrock'

const CLAUDE_V2_ON_DEMAND_COST_PER_1000_INPUT_TOKENS = '0.01102'
const CLAUDE_V2_ON_DEMAND_COST_PER_1000_OUTPUT_TOKENS = '0.03268'
const USD_HOURLY_COST_ALARM_THRESHOLD = 1.0

interface PriceMonitorStackProps extends cdk.StackProps {
  modelId: string
  bedrockRegion: string
}

export class PriceMonitorStack extends cdk.Stack {
  constructor (scope: Construct, id: string, props: PriceMonitorStackProps) {
    super(scope, id, props)

    const { modelId, bedrockRegion } = props

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'EpisoderPriceMonitor',
      defaultInterval: cdk.Duration.days(7),
      periodOverride: cloudwatch.PeriodOverride.AUTO
    })

    const invocationsMetric = new cloudwatch.Metric({
      namespace: BEDROCK_METRIC_NAMESPACE,
      metricName: 'Invocations',
      region: bedrockRegion,
      statistic: 'Sum',
      label: 'Invocations',
      dimensionsMap: {
        ModelId: modelId
      }
    })

    const inputTokensMetric = new cloudwatch.Metric({
      namespace: BEDROCK_METRIC_NAMESPACE,
      metricName: 'InputTokenCount',
      region: bedrockRegion,
      statistic: 'Sum',
      label: 'Input Tokens',
      dimensionsMap: {
        ModelId: modelId
      }
    })

    const outputTokensMetric = new cloudwatch.Metric({
      namespace: BEDROCK_METRIC_NAMESPACE,
      metricName: 'OutputTokenCount',
      region: bedrockRegion,
      statistic: 'Sum',
      label: 'Output Tokens',
      dimensionsMap: {
        ModelId: modelId
      }
    })

    const inputTokensCostMetric = new cloudwatch.MathExpression({
      label: 'Input Token Cost ($)',
      expression: `(inputTokens / 1000) * ${CLAUDE_V2_ON_DEMAND_COST_PER_1000_INPUT_TOKENS}`,
      usingMetrics: {
        inputTokens: inputTokensMetric
      }
    })

    const outputTokensCostMetric = new cloudwatch.MathExpression({
      label: 'Output Token Cost ($)',
      expression: `(outputTokens / 1000) * ${CLAUDE_V2_ON_DEMAND_COST_PER_1000_OUTPUT_TOKENS}`,
      usingMetrics: {
        outputTokens: outputTokensMetric
      }
    })

    const totalCostMetric = new cloudwatch.MathExpression({
      label: 'Total Cost ($)',
      expression: '(inputTokensCost + outputTokensCost)',
      usingMetrics: {
        inputTokensCost: inputTokensCostMetric,
        outputTokensCost: outputTokensCostMetric
      }
    })

    const costPerInvocationMetric = new cloudwatch.MathExpression({
      label: 'Cost per Invocation ($)',
      expression: 'totalCost / invocations',
      usingMetrics: {
        totalCost: totalCostMetric,
        invocations: invocationsMetric
      }
    })

    const priceWidget = new cloudwatch.SingleValueWidget({
      title: `Bedrock ${modelId} Price Monitor`,
      setPeriodToTimeRange: true,
      period: cdk.Duration.days(1),
      width: 24,
      height: 6,
      metrics: [
        invocationsMetric,
        inputTokensMetric,
        outputTokensMetric,
        inputTokensCostMetric,
        outputTokensCostMetric,
        totalCostMetric,
        costPerInvocationMetric
      ]
    })

    dashboard.addWidgets(priceWidget)

    const hourlyCostMetric = new cloudwatch.MathExpression({
      label: 'Total Cost ($)',
      expression: '(inputTokensCost + outputTokensCost)',
      period: cdk.Duration.hours(1),
      usingMetrics: {
        inputTokensCost: inputTokensCostMetric,
        outputTokensCost: outputTokensCostMetric
      }
    })

    const hourlyCostAlarm = hourlyCostMetric.createAlarm(this, 'TotalCostAlarm', {
      threshold: USD_HOURLY_COST_ALARM_THRESHOLD,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      datapointsToAlarm: 3,
      alarmName: `Bedrock ${modelId} Hourly Cost`,
      alarmDescription: `Total Cost per Hour exceeds $${USD_HOURLY_COST_ALARM_THRESHOLD}`
    })

    const hourlyCostAlarmWidget = new cloudwatch.AlarmWidget({
      alarm: hourlyCostAlarm,
      height: 6,
      width: 24,
      region: bedrockRegion,
      title: `Bedrock ${modelId} Hourly Cost Alarm`
    })
    dashboard.addWidgets(hourlyCostAlarmWidget)
  }
}
