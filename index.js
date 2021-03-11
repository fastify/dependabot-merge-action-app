'use strict'

const Fastify = require('fastify')

const fastify = Fastify({
  logger: true,
})

const config = require('./config')

fastify.register(require('./server'), config)

fastify.listen(config.PORT, '0.0.0.0')
