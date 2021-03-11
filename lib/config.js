'use strict'

const envSchema = require('env-schema')
const S = require('fluent-json-schema')

const config = envSchema({
  schema: S.object()
    .prop('PORT', S.number().default(3000))
    .prop('PRIVATE_KEY', S.string().required())
    .prop('APP_ID', S.string().required()),
  dotenv: true,
})

module.exports = config
