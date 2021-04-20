'use strict'

const tap = require('tap')

const server = require('../lib/server')

function startServer() {
  const fastify = require('fastify')()

  fastify.register(server)

  return fastify
}

tap.test('hello world', async t => {
  const app = startServer()

  const response = await app.inject('/')

  t.same(response.json(), { hello: 'world' })
})
