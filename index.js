'use strict'

const Fastify = require('fastify')

const fastify = Fastify()

fastify.register(require('./server'))

fastify.listen(process.env.PORT || 3000, '0.0.0.0')
