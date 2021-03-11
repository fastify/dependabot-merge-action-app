'use strict'

const [url, token, pullRequestNumber] = process.argv.slice(2)

const h = /^https/.test(url) ? require('https') : require('http')

h.request(
  url,
  {
    method: 'POST',
    headers: {
      authorization: `token ${token}`,
    },
  },
  res => {
    if (res.statusCode !== 200) {
      throw new Error(`request failed with status code ${res.statusCode}`)
    }
  }
)
  .write(JSON.stringify({ pullRequestNumber }))
  .end()
