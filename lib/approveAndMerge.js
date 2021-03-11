'use strict'
const {
  getInstallationRepositories,
  getRepositoryInstallation,
  createInstallationAccessToken,
  approvePullRequest,
  getPullRequest,
  mergePullRequest,
} = require('./github')

const DEPENDABOT = 'dependabot[bot]'

async function approveAndMerge(
  githubToken,
  appJWT,
  pullRequestNumber,
  options
) {
  const [repository] = await getInstallationRepositories(githubToken)

  if (!repository) {
    throw new Error('no repository accessible with provided token')
  }

  const {
    name: repo,
    owner: { login: owner },
  } = repository

  const installation = await getRepositoryInstallation(owner, repo, appJWT)

  if (!installation) {
    throw new Error('no installation found for app on repo')
  }

  const { token: accessToken } = await createInstallationAccessToken(
    installation,
    appJWT
  )

  const pullRequest = await getPullRequest(
    owner,
    repo,
    pullRequestNumber,
    accessToken
  )

  if (!pullRequest) {
    throw new Error('pull request not found')
  }

  const isDependabotPR = pullRequest.user.login === DEPENDABOT

  if (!isDependabotPR) {
    return 'Not dependabot PR, skipping'
  }

  // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
  const pkgName = pullRequest.head.ref.split('/').pop().split('-').shift()

  if (options.excludePackages.includes(pkgName)) {
    return `${pkgName} is excluded, skipping`
  }

  await approvePullRequest(
    owner,
    repo,
    pullRequestNumber,
    accessToken,
    options.approveComment
  )

  if (options.approveOnly) {
    return 'Approving only'
  }

  await mergePullRequest(
    owner,
    repo,
    pullRequestNumber,
    accessToken,
    options.mergeMethod
  )
}

module.exports = approveAndMerge
