'use strict'

const tap = require('tap')
const proxyquire = require("proxyquire")
const assert = require('assert')

let mockCreateAppJWT, mockGetInstallationRepositories, mockCreateInstallationAccessToken, mockGetRepositoryInstallation, mockGetPullRequest, mockApprovePullRequest, mockMergePullRequest

const approveAndMerge = proxyquire('../lib/approveAndMerge', {
  './github.js': {
    createAppJWT: () => mockCreateAppJWT(),
    getInstallationRepositories: () => mockGetInstallationRepositories(),
    createInstallationAccessToken: () => mockCreateInstallationAccessToken(),
    getRepositoryInstallation: () => mockGetRepositoryInstallation(),
    getPullRequest: () => mockGetPullRequest(),
    approvePullRequest: () => mockApprovePullRequest(),
    mergePullRequest: () => mockMergePullRequest(),
  }
})

tap.test('approveAndMerge function', t => {

  t.beforeEach(() => {
    mockCreateAppJWT = (appId, privateKey) => { }
    mockGetInstallationRepositories = async (token) => [{ name: 'the-repo', owner: { login: 'the-owner' } }]
    mockCreateInstallationAccessToken = async (installation, appJWT) => ({ token: 'the-access-token' })
    mockGetRepositoryInstallation = async (owner, repo, appJWT) => { }
    mockGetPullRequest = async (owner, repo, pullRequestNumber, accessToken) => ({
      user: { login: 'dependabot[bot]' },
      head: { ref: "dependabot/npm_and_yarn/pkg-0.0.1" }
    })
    mockApprovePullRequest = async (owner, repo, pullRequestNumber, accessToken, approveComment) => { }
    mockMergePullRequest = async (owner, repo, pullRequestNumber, accessToken, mergeMethod) => { }
  })

  t.plan(5)

  t.test('should pass', async t => {
    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: [] }

    await approveAndMerge(githubToken, appJWT, pullRequestNumber, options)

    t.pass()
  })

  t.test('should throw error on missing app installation in repo', async t => {
    mockGetRepositoryInstallation = () => { assert(false, '{"message":"Integration not found"}') }

    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: [] }

    try {
      await approveAndMerge(githubToken, appJWT, pullRequestNumber, options)
      t.fail('approveAndMerge is suppose to throw an error')
    } catch (error) {
      t.match(error.message, /Integration not found/)
    }
  })

  t.test('should return a message if the author of the PR is not dependabot', async t => {
    mockGetPullRequest = async (owner, repo, pullRequestNumber, accessToken) => ({
      user: { login: 'spambot' },
      head: { ref: "dependabot/npm_and_yarn/pkg-0.0.1" }
    })

    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: [] }

    t.equal(await approveAndMerge(githubToken, appJWT, pullRequestNumber, options), 'Not dependabot PR, skipping')
  })

  t.test('should return a message if package has to be skipped', async t => {
    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: ['pkg'] }

    t.equal(await approveAndMerge(githubToken, appJWT, pullRequestNumber, options), 'pkg is excluded, skipping')
  })

  t.test('should return a message on approve only option', async t => {
    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: [], approveOnly: true }

    t.equal(await approveAndMerge(githubToken, appJWT, pullRequestNumber, options), 'Approving only')
  })
})
