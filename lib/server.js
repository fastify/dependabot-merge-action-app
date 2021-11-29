'use strict'

const { Unauthorized, BadRequest } = require('http-errors')
const S = require('fluent-json-schema')

const approveAndMerge = require('./approveAndMerge')
const { createAppJWT } = require('./github')

const schema = {
  body: S.object()
    .prop('pullRequestNumber', S.number().required())
    .prop('approveOnly', S.boolean().default(false))
    .prop('excludePackages', S.array().items(S.string()).default([]))
    .prop('approveComment', S.string())
    .prop('mergeMethod', S.string().default('squash')),
}

module.exports = async (fastify, options) => {
  fastify.get('/', async () => ({ hello: 'world' }))

  fastify.post('/', { schema }, async req => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new Unauthorized()
    }

    const [, githubToken] = githubTokenMatch
    const {
      pullRequestNumber,
      approveOnly,
      excludePackages,
      approveComment,
      mergeMethod,
    } = req.body

    const appJWT = createAppJWT(options.APP_ID, options.PRIVATE_KEY)

    try {
      return await approveAndMerge(
        req,
        githubToken,
        appJWT,
        pullRequestNumber,
        {
          approveOnly,
          excludePackages,
          approveComment,
          mergeMethod,
        }
      )
    } catch (error) {
      if(error.statusCode) {
        // this is a fastify http error
        throw error
      }

      throw new BadRequest(
        'See https://github.com/fastify/github-action-merge-dependabot#usage - ' +
          error.message
      )
    }
  })
}
