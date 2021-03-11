'use strict'

const { promisify } = require('util')
const { Unauthorized } = require('http-errors')
const fetch = require('node-fetch')

const delay = promisify(setTimeout)

module.exports = async fastify => {
  fastify.get('/', async () => ({ hello: 'world' }))

  fastify.post('/', async req => {
    const match = /bearer (.+)$/i.exec(req.headers.authorization)

    if (!match || !match[1]) {
      throw new Unauthorized()
    }

    const [, token] = match

    console.log(token)

    await delay(5 * 60 * 1000)

    return token
  })
}
