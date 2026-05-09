import { Request, Response, NextFunction } from 'express'
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const region = process.env.AWS_REGION || 'ap-northeast-1'
const userPoolId = process.env.COGNITO_USER_POOL_ID || ''

const client = jwksClient({
  jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000, // 10分
})

function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid!, (err, key) => {
    callback(err, key?.getPublicKey())
  })
}

export interface AuthenticatedRequest extends Request {
  userId?: string
  userEmail?: string
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!userPoolId) {
    res.status(500).json({ error: 'サーバーのCognito設定が不足しています' })
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: '認証が必要です' })
    return
  }

  const token = authHeader.slice(7)
  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      console.error('[Auth Error]', err.message)
      res.status(401).json({ error: '認証トークンが無効です' })
      return
    }
    const payload = decoded as Record<string, string>
    req.userId = payload['sub']
    req.userEmail = payload['email']
    next()
  })
}
