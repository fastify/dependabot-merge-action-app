'use strict'

const { Unauthorized } = require('http-errors')
const fetch = require('node-fetch')

module.exports = async fastify => {
  fastify.get('/', async () => ({ hello: 'world' }))

  fastify.post('/', async req => {
    const match = /bearer (.+)$/i.exec(req.headers.authorization)

    if (!match || !match[1]) {
      throw new Unauthorized()
    }

    const [, token] = match

    console.log(token)

    const res = await fetch('https://api.github.com/orgs/nearform/repos', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        authorization: `token ${token}`,
      },
    })

    return res.json()

    // return octokit.repos.get({
    //   owner: 'nearform',
    //   repo: 'dependabot-merge-action-app',
    // })
  })
}
