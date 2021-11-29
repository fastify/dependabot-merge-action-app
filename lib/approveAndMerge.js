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

  const { name: pkgName, version } = getPackageDetails(pullRequest)

  if (pkgName === 'github-action-merge-dependabot' && isMajorRelease(pullRequest)) {
    const err = new Error(`Cannot automerge github-action-merge-dependabot ${version} major release.
Read how to upgrade it manually:
https://github.com/fastify/github-action-merge-dependabot/releases/tag/v${version}
`)
    err.statusCode = 422
    throw err
  }

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

function getPackageDetails(pullRequest) {
  // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
  // or "dependabot/github_actions/fastify/github-action-merge-dependabot-2.6.0"
  const nameAndVersion = pullRequest.head.ref.split('/').pop().split('-')
  const version = nameAndVersion.pop() // remove the version
  return {
    name: nameAndVersion.join('-'),
    version
  }
}

function isMajorRelease(pullRequest) {
  const expression = /bump \S+ from (\S+) to (\S+)/i
  const match = expression.exec(pullRequest.title)
  if (match) {
    const [, oldVersion, newVersion] = match
    if (oldVersion.split('.')[0] !== newVersion.split('.')[0]) {
      return true
    }
  }
  return false
}

module.exports = approveAndMerge
