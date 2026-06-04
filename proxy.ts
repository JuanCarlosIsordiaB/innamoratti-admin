import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import type { SessionPayload } from '@/lib/types'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

async function getPayload(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Si ya está en login y tiene sesión válida, redirigir según rol
  if (pathname === '/login') {
    const session = await getPayload(request)
    if (session) {
      const dest = session.role === 'admin' || session.role === 'dueno' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  const session = await getPayload(request)

  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }

  const { role } = session

  // Solo admin/dueño pueden acceder a /admin
  if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'dueno') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // El acceso por área en /checklist/[areaId] lo maneja el server component
  // con una consulta dinámica a la BD (getAreaForRole en area-definitions-db.ts).
  // No se usa ROLE_AREAS aquí porque esa lista es hardcodeada y no incluye
  // secciones creadas dinámicamente por el admin.

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
}
