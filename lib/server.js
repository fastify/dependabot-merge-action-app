'use strict'

const { Unauthorized } = require('http-errors')
const approveAndMerge = require('./approveAndMerge')
const { createAppJWT } = require('./github')

module.exports = async (fastify, options) => {
  fastify.get('/', async () => ({ hello: 'world' }))

  fastify.post('/', async req => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new Unauthorized()
    }

    const [, githubToken] = githubTokenMatch
    const { pullRequestNumber, approveOnly = false } = req.body

    const appJWT = createAppJWT(options.APP_ID, options.PRIVATE_KEY)

    return approveAndMerge(githubToken, appJWT, pullRequestNumber, approveOnly)
  })
}
