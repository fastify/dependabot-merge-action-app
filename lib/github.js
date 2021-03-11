'use strict'

const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')

function createAppJWT(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000)

  const appToken = jwt.sign(
    {
      iat: now,
      // 10 minutes
      exp: now + 10 * 60,
      iss: appId,
    },
    privateKey,
    { algorithm: 'RS256' }
  )

  return appToken
}

async function getInstallationRepositories(token) {
  const repositoriesRes = await fetch(
    'https://api.github.com/installation/repositories',
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        authorization: `token ${token}`,
      },
    }
  )

  const { repositories } = await repositoriesRes.json()

  return repositories
}

async function getInstallationAccessToken(installation, appJWT) {
  const res = await fetch(installation.access_tokens_url, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github.v3+json',
      authorization: `bearer ${appJWT}`,
    },
  })

  return res.json()
}

async function getRepositoryInstallation(owner, repo, appJWT) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/installation`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `bearer ${appJWT}`,
      },
    }
  )

  return res.json()
}

async function approvePullRequest(owner, repo, pullRequestNumber, accessToken) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}/reviews`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `bearer ${accessToken}`,
      },
      body: JSON.stringify({ event: 'APPROVE' }),
    }
  )

  return res.json()
}

module.exports = {
  createAppJWT,
  getInstallationRepositories,
  getRepositoryInstallation,
  getInstallationAccessToken,
  approvePullRequest,
}
