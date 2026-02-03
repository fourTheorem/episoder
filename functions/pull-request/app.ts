import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { Octokit } from 'octokit'
import { simpleGit } from 'simple-git'

import envs from '../../lib/envs'
import { logger, middify } from '../../lib/lambda-common'
import type { Summary } from '../../lib/types'
import { getS3JSON, getS3Text } from '../../lib/utils'
import { createPullRequestDescription } from './pr-description'

const GIT_HUB_CREDENTIALS_SSM_PARAMETER = '/episoder/gitHubUserCredentials'

const { BUCKET_NAME, GIT_REPO_URL, GIT_USER_EMAIL, GIT_USER_NAME } = envs
const { TARGET_BRANCH } = process.env

const ssmClient = new SSMClient({})
const s3Client = new S3Client({})

// A personal access token is used to clone and push from/to GitHub
const gitHubUserCredentialsPromise = ssmClient.send(
  new GetParameterCommand({
    Name: GIT_HUB_CREDENTIALS_SSM_PARAMETER,
    WithDecryption: true,
  }),
)

interface PullRequestEvent {
  transcriptKey: string
  vttKey: string
  summary: Summary
}

/**
 * Lambda Function handler to create a GitHub Pull Request against a configured repository with the contents of a transcript
 * retrieved from S3. The process:
 *
 * - Clones the Git repository
 * - Creates a branch and adds the transcript in a new commit
 * - Creates a GitHub Pull Request against the main branch
 * - Returns the GitHub PR URL
 *
 * This function requires a GitHub Personal Access Token, preferably a fine-grained token. It should be stored with the username
 * in a SSM SecureString Parameter (defined by env GIT_HUB_CREDENTIALS_SSM_PARAMETER) in the format <Username>:<GitHubPersonalAccessToken>
 */
export const handleEvent = middify(async (event: PullRequestEvent) => {
  const transcript = await getS3JSON(s3Client, BUCKET_NAME, event.transcriptKey)
  const vttContent = await getS3Text(s3Client, BUCKET_NAME, event.vttKey)
  // Extract episode number from filename, stripping _caption suffix (e.g., "150_caption.json" -> "150")
  const id: string = path.basename(event.transcriptKey).replace('_caption.json', '')

  const tmpDir = await mkdtemp(path.join(tmpdir(), 'pr-'))
  logger.info('Using temporary directory', { tmpDir })
  try {
    const ts = new Date().toISOString().replace(/[^\d]+/g, '')

    const branchName = `ep-${id}-transcript-${ts}`
    const gitHubUserCredentials = (await gitHubUserCredentialsPromise).Parameter?.Value
    if (typeof gitHubUserCredentials !== 'string') {
      throw new Error('No gitHubUserCredentials found')
    }
    const [username, password] = gitHubUserCredentials.split(':')
    if (username === undefined || password === undefined || username === '' || password === '') {
      throw new Error(
        `${GIT_HUB_CREDENTIALS_SSM_PARAMETER} SSM Parameter should be in the format <Username>:<GitHubPersonalAccessToken>`,
      )
    }

    const gitUrl = new URL(GIT_REPO_URL)
    gitUrl.username = username
    gitUrl.password = password

    const git = simpleGit(tmpDir)
    await git
      .addConfig('user.email', GIT_USER_EMAIL, true, 'global')
      .addConfig('user.name', GIT_USER_NAME, true, 'global')
      .addConfig('credential.helper', 'cache 900', true, 'global')

    const repoName: string = path.basename(gitUrl.pathname).split('.')[0]
    logger.info('Cloning', { tmpDir, localPath: repoName, url: GIT_REPO_URL })
    await git.clone(gitUrl.toString(), repoName)

    logger.info('Checking out new branch', { branchName })
    await git.cwd(path.resolve(tmpDir, repoName)).checkoutBranch(branchName, 'HEAD')

    logger.info('Adding transcript and captions', { branchName })
    const transcriptsDir = path.join(tmpDir, repoName, 'src', '_transcripts')
    await mkdir(transcriptsDir, { recursive: true })

    const jsonFilePath = path.join(transcriptsDir, `${id}.json`)
    await writeFile(jsonFilePath, JSON.stringify(transcript, null, '  '))

    const vttFilePath = path.join(transcriptsDir, `${id}.vtt`)
    await writeFile(vttFilePath, vttContent)

    await git.add([jsonFilePath, vttFilePath])

    logger.info('Committing and pushing')
    const title = `add episode ${id} transcript and captions`
    await git.commit(`chore: ${title}`)
    await git.push('origin', branchName, ['--set-upstream'])

    logger.info('Creating GitHub PR')
    const octokit = new Octokit({ auth: password })
    const body = createPullRequestDescription(event.summary)
    const head = branchName
    const base = TARGET_BRANCH === undefined ? 'main' : TARGET_BRANCH
    const repoPath = gitUrl.pathname
    const [, owner] = repoPath.split('/')
    const response = await octokit.request(`POST /repos/${owner}/${repoName}/pulls`, {
      owner,
      title,
      body,
      head,
      base,
      repo: repoName,
    })
    const prUrl = response.data.html_url
    console.log('Created PR', { prUrl })
    return { prUrl }
  } finally {
    await rm(tmpDir, { recursive: true })
  }
})
