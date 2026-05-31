import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import type { Role, SessionPayload } from '@/lib/types'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

export async function createSession(userId: string, role: Role, name: string) {
  const token = await new SignJWT({ userId, role, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .setIssuedAt()
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 12,
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function verifyRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
