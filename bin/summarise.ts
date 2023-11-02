#!/usr/bin/env ./node_modules/.bin/ts-node

import { readFileSync } from 'fs'
import { createSummary } from '../lib/summarisation'

import yargs from 'yargs'
import { Transcript } from '../lib/types'

interface Argv {
  transcriptFilePath: string
  bedrockRegion: string
}

const argv: Argv = yargs
  .usage('Usage: $0 <transcriptFilePath>')
  .command('$0 <transcriptFilePath>', 'path to the transcript JSON file')
  .options('bedrock-region', {
    default: 'us-east-1'
  })
  .alias('h', 'help')
  .help('help')
  .demandCommand(1, 'You need to provide a filename argument.')
  .argv as unknown as Argv

const filename: string = argv.transcriptFilePath
const transcriptContents = readFileSync(filename, 'utf8')
const transcript = JSON.parse(transcriptContents)

summarise(transcript)

async function summarise (transcript: Transcript): Promise<void> {
  const summary = await createSummary(transcript, { bedrockRegion: argv.bedrockRegion })
  console.log(JSON.stringify(summary, null, 4))
}
