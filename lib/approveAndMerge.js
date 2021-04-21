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

const ERROR_REPO_NOT_FOUND = 'no repository accessible with provided token - see https://github.com/fastify/github-action-merge-dependabot#usage'
const ERROR_APP_NOT_FOUND = 'no installation found for app on repo - see https://github.com/fastify/github-action-merge-dependabot#usage'
const ERROR_PULL_REQUEST_NOT_FOUND = 'pull request not found'
const MESSAGE_NO_DEPENDABOT_PR = 'not a dependabot PR, skipping'
const MESSAGE_APPROVING_ONLY = 'approving only'
const MESSAGE_PACKAGE_IS_EXCLUDED = 'is excluded, skipping'

async function approveAndMerge(
  githubToken,
  appJWT,
  pullRequestNumber,
  options
) {
  let repository, installation, accessToken, pullRequest

  try {
    [repository] = await getInstallationRepositories(githubToken)
  } catch (error) {
    throw new Error(ERROR_REPO_NOT_FOUND)
  }

  const {
    name: repo,
    owner: { login: owner },
  } = repository

  try {
    installation = await getRepositoryInstallation(owner, repo, appJWT)
  } catch (error) {
    throw new Error(ERROR_APP_NOT_FOUND)
  }

  try {
    const access = await createInstallationAccessToken(installation, appJWT)
    accessToken = access.token
  } catch (error) {
    throw new Error(ERROR_APP_NOT_FOUND)
  }

  try {
    pullRequest = await getPullRequest(
      owner,
      repo,
      pullRequestNumber,
      accessToken
    )
  } catch (error) {
    throw new Error(ERROR_PULL_REQUEST_NOT_FOUND)
  }

  const isDependabotPR = pullRequest.user.login === DEPENDABOT

  if (!isDependabotPR) {
    return MESSAGE_NO_DEPENDABOT_PR
  }

  // dependabot branch names are in format "dependabot/npm_and_yarn/pkg-0.0.1"
  const pkgName = pullRequest.head.ref.split('/').pop().split('-').shift()

  if (options.excludePackages.includes(pkgName)) {
    return `${pkgName} ${MESSAGE_PACKAGE_IS_EXCLUDED}`
  }

  await approvePullRequest(
    owner,
    repo,
    pullRequestNumber,
    accessToken,
    options.approveComment
  )

  if (options.approveOnly) {
    return MESSAGE_APPROVING_ONLY
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
