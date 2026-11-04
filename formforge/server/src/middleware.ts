import type { ErrorRequestHandler, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { ZodError } from 'zod'

export const signToken = (userId: string) => jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  try {
    if (!token) throw new Error('missing')
    res.locals.userId = String((jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload).sub)
    next()
  } catch { res.status(401).json({ error: 'Authentication required' }) }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) { res.status(400).json({ error: 'Validation failed', issues: err.flatten().fieldErrors }); return }
  if (err?.code === 11000) { res.status(409).json({ error: 'Already exists' }); return }
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
}
