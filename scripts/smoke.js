'use strict'

const { getInstallationRepositories } = require('../lib/github')

const [token] = process.argv.slice(2)

async function run() {
  // const [repository] = getInstallationRepositories(token)
}

run()
