'use strict'

const envSchema = require('env-schema')
const S = require('fluent-json-schema')

const config = envSchema({
  schema: S.object().prop('PORT', S.number().default(3000)),
  dotenv: true,
})

module.exports = config
