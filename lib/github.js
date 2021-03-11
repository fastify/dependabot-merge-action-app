'use strict'

const assert = require('assert')
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
  const res = await fetch('https://api.github.com/installation/repositories', {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      authorization: `token ${token}`,
    },
  })

  const json = await res.json()

  assert(res.ok, JSON.stringify(json))

  return json.repositories
}

async function createInstallationAccessToken(installation, appJWT) {
  const res = await fetch(installation.access_tokens_url, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github.v3+json',
      authorization: `bearer ${appJWT}`,
    },
  })

  const json = await res.json()

  assert(res.ok, JSON.stringify(json))

  return json
}

async function getRepositoryInstallation(owner, repo, appJWT) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/installation`,
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `bearer ${appJWT}`,
      },
    }
  )

  const json = await res.json()

  assert(res.ok, JSON.stringify(json))

  return json
}

async function getPullRequest(owner, repo, pullRequestNumber, accessToken) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}`,
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `bearer ${accessToken}`,
      },
    }
  )

  const json = await res.json()

  assert(res.ok, JSON.stringify(json))

  return json
}

async function approvePullRequest(
  owner,
  repo,
  pullRequestNumber,
  accessToken,
  approveComment
) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}/reviews`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `bearer ${accessToken}`,
      },
      body: JSON.stringify({
        event: 'APPROVE',
        body: approveComment,
      }),
    }
  )

  const json = await res.json()

  assert(res.ok, JSON.stringify(json))

  return json
}

async function mergePullRequest(
  owner,
  repo,
  pullRequestNumber,
  accessToken,
  mergeMethod
) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}/merge`,
    {
      method: 'PUT',
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `bearer ${accessToken}`,
      },
      body: JSON.stringify({
        merge_method: mergeMethod,
      }),
    }
  )

  const json = await res.json()

  assert(res.ok, JSON.stringify(json))

  return json
}

module.exports = {
  createAppJWT,
  getInstallationRepositories,
  getRepositoryInstallation,
  createInstallationAccessToken,
  approvePullRequest,
  mergePullRequest,
  getPullRequest,
}
