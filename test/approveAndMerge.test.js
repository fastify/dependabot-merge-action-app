'use strict'

const tap = require('tap')
const proxyquire = require('proxyquire')
const assert = require('assert')

let mockRequest,
  mockCreateAppJWT,
  mockGetInstallationRepositories,
  mockCreateInstallationAccessToken,
  mockGetRepositoryInstallation,
  mockGetPullRequest,
  mockApprovePullRequest,
  mockMergePullRequest

const approveAndMerge = proxyquire('../lib/approveAndMerge', {
  './github.js': {
    createAppJWT: () => mockCreateAppJWT(),
    getInstallationRepositories: () => mockGetInstallationRepositories(),
    createInstallationAccessToken: () => mockCreateInstallationAccessToken(),
    getRepositoryInstallation: () => mockGetRepositoryInstallation(),
    getPullRequest: () => mockGetPullRequest(),
    approvePullRequest: () => mockApprovePullRequest(),
    mergePullRequest: () => mockMergePullRequest(),
  },
})

tap.test('approveAndMerge function', t => {
  t.beforeEach(() => {
    mockRequest = { log: { info: () => {} } }
    mockCreateAppJWT = () => {}
    mockGetInstallationRepositories = async () => [
      { name: 'the-repo', owner: { login: 'the-owner' } },
    ]
    mockCreateInstallationAccessToken = async () => ({
      token: 'the-access-token',
    })
    mockGetRepositoryInstallation = async () => {}
    mockGetPullRequest = async () => ({
      user: { login: 'dependabot[bot]' },
      head: { ref: 'dependabot/npm_and_yarn/pkg-0.0.1' },
    })
    mockApprovePullRequest = async () => {}
    mockMergePullRequest = async () => {}
  })

  t.plan(5)

  t.test('should pass', async t => {
    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: [] }

    await approveAndMerge(
      mockRequest,
      githubToken,
      appJWT,
      pullRequestNumber,
      options
    )

    t.pass()
  })

  t.test('should throw error on missing app installation in repo', async t => {
    mockGetRepositoryInstallation = () => {
      assert(false, '{"message":"Integration not found"}')
    }

    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: [] }

    try {
      await approveAndMerge(
        mockRequest,
        githubToken,
        appJWT,
        pullRequestNumber,
        options
      )
      t.fail('approveAndMerge is suppose to throw an error')
    } catch (error) {
      t.match(error.message, /Integration not found/)
    }
  })

  t.test(
    'should return a message if the author of the PR is not dependabot',
    async t => {
      mockGetPullRequest = async () => ({
        user: { login: 'spambot' },
        head: { ref: 'dependabot/npm_and_yarn/pkg-0.0.1' },
      })

      const githubToken = 'the-github-token'
      const appJWT = 'jwt-token'
      const pullRequestNumber = 123
      const options = { excludePackages: [] }

      t.equal(
        await approveAndMerge(
          mockRequest,
          githubToken,
          appJWT,
          pullRequestNumber,
          options
        ),
        'Not dependabot PR, skipping'
      )
    }
  )

  t.test('should return a message if package has to be skipped', async t => {
    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: ['pkg-with-dashes'] }

    mockGetPullRequest = async () => ({
      user: { login: 'dependabot[bot]' },
      head: { ref: 'dependabot/github_actions/fastify/pkg-with-dashes-2.6.0' },
    })

    t.equal(
      await approveAndMerge(
        mockRequest,
        githubToken,
        appJWT,
        pullRequestNumber,
        options
      ),
      'pkg-with-dashes is excluded, skipping'
    )
  })

  t.test('should return a message on approve only option', async t => {
    const githubToken = 'the-github-token'
    const appJWT = 'jwt-token'
    const pullRequestNumber = 123
    const options = { excludePackages: [], approveOnly: true }

    t.equal(
      await approveAndMerge(
        mockRequest,
        githubToken,
        appJWT,
        pullRequestNumber,
        options
      ),
      'Approving only'
    )
  })
})
