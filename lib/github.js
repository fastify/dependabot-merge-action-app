'use strict'

const jwt = require('jsonwebtoken')

function getAppToken(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000)

  const appToken = jwt.sign(
    {
      iat: now,
      // 10 minutes
      exp: now + 10 * 60,
      iss: appId,
    },
    privateKey,
    { algorithm: 'RS256' }
  )

  return appToken
}

module.exports = {
  getAppToken,
}
