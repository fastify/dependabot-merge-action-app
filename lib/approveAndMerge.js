'use strict'
const {
  getInstallationRepositories,
  getRepositoryInstallation,
  getInstallationAccessToken,
  approvePullRequest,
} = require('./github')

async function approveAndMerge(
  githubToken,
  appJWT,
  pullRequestNumber,
  approveOnly
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

  const { token: accessToken } = await getInstallationAccessToken(
    installation,
    appJWT
  )

  await approvePullRequest(owner, repo, pullRequestNumber, accessToken)
}

module.exports = approveAndMerge
