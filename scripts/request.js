'use strict'

const [url, token, pullRequestNumber] = process.argv.slice(2)

const h = /^https/.test(url) ? require('https') : require('http')

const req = h.request(
  url,
  {
    method: 'POST',
    headers: {
      authorization: `token ${token}`,
      'content-type': 'application/json',
    },
  },
  res => {
    if (res.statusCode !== 200) {
      throw new Error(`request failed with status code ${res.statusCode}`)
    }
  }
)
req.write(JSON.stringify({ pullRequestNumber }))
req.end()
