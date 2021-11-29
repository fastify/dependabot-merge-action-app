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
  // or "dependabot/github_actions/fastify/github-action-merge-dependabot-2.6.0"
  const nameAndVersion = pullRequest.head.ref.split('/').pop().split('-')
  nameAndVersion.pop() // remove the version
  const pkgName = nameAndVersion.join('-')

  if (pkgName === 'github-action-merge-dependabot') {
    const expression = /bump \S+ from (\S+) to (\S+)/i
    const match = expression.exec(pullRequest.title)
    if (match) {
      const [, oldVersion, newVersion] = match
      if (oldVersion.split('.')[0] !== newVersion.split('.')[0]) {
        const err = new Error(`Cannot automerge github-action-merge-dependabot ${newVersion} major release.
Read how to upgrade it manually:
https://github.com/fastify/github-action-merge-dependabot/releases/tag/v${newVersion}
`)
        err.statusCode = 422
        throw err
      }
    }
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

module.exports = approveAndMerge
