import { test, assert } from 'vitest'
import { createPullRequestDescription, secondsToYtTime } from '../../../functions/pull-request/pr-description'

test('chapter timestamps are correctly generated in a YouTube format', async () => {
  assert.equal(secondsToYtTime(0), '00:00')
  assert.equal(secondsToYtTime(0.4), '00:00')
  assert.equal(secondsToYtTime(1), '00:01')
  assert.equal(secondsToYtTime(60), '01:00')
  assert.equal(secondsToYtTime(839.6), '13:59')
  assert.equal(secondsToYtTime(999.99), '16:39')
  assert.equal(secondsToYtTime(3600), '60:00')
  assert.equal(secondsToYtTime(7313), '121:53')
})

test('PR description is correctly generated', async () => {
  const summary = {
    episodeSummary: 'We hallucinate about topics we don\'t understand',
    chapters: [{
      startTimestamp: 0,
      summary: 'Introduction'
    },
    {
      startTimestamp: 23.4,
      summary: 'Uses cases for AWS InfiniDash'
    },
    {
      startTimestamp: 63.7,
      summary: 'Comparing InfiniDash to Amazon SplodgeWrangler'
    },
    {
      startTimestamp: 391.999,
      summary: 'Securing a second mortgage to pay for InfiniDash'
    },
    {
      startTimestamp: 1030.30,
      summary: 'How to lobby the CloudFormation team for full InfiniDash support'
    },
    {
      startTimestamp: 2999.123,
      summary: 'Conclusion and desperate appeal for more subscribers'
    }
  ]}

  const markdown = createPullRequestDescription(summary)
  assert.equal(markdown, `
# Transcript
This change includes the generated transcript for the podcast episode. 

## Episode Summary

We hallucinate about topics we don't understand

## Suggested Chapters
00:00 Introduction
00:23 Uses cases for AWS InfiniDash
01:03 Comparing InfiniDash to Amazon SplodgeWrangler
06:31 Securing a second mortgage to pay for InfiniDash
17:10 How to lobby the CloudFormation team for full InfiniDash support
49:59 Conclusion and desperate appeal for more subscribers
`)
})