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
  request,
  githubToken,
  appJWT,
  pullRequestNumber,
  options
) {
  const [repository] = await getInstallationRepositories(githubToken)

  const {
    name: repo,
    owner: { login: owner },
  } = repository

  request.log.info(`Running on repository ${owner}/${repo}`)

  const installation = await getRepositoryInstallation(owner, repo, appJWT)

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

  return mergePullRequest(
    owner,
    repo,
    pullRequestNumber,
    accessToken,
    options.mergeMethod
  )
}

module.exports = approveAndMerge
