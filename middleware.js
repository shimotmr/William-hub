import { NextResponse } from 'next/server'

/**
 * Middleware: 路由保護與認證檢查
 */
export function middleware(request) {
  const { pathname } = request.nextUrl

  // 直接在這裡檢查，不要呼叫函數
  if (pathname === '/login') {
    return NextResponse.next()
  }
  
  if (pathname.endsWith('.html')) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/v4')) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/api/public/')) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  // 檢查 session cookie
  const session = request.cookies.get('session')
  
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// 設定 middleware 匹配的路徑
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
