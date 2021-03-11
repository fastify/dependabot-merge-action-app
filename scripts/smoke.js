'use strict'

const [token] = process.argv.slice(2)

async function run() {
  const fetch = require('node-fetch')

  const res = await fetch('https://api.github.com/orgs/nearform/repos', {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      authorization: `token ${token}`,
    },
  })

  console.log(res.json())
}

run()
