import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/login', '/api/auth'];
  
  // Se a rota é pública, permitir acesso
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Para outras rotas, verificar autenticação via cookie ou header
  // Como estamos usando localStorage, vamos redirecionar para login
  // e deixar o cliente verificar a autenticação
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};