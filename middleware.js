import { NextResponse } from 'next/server'

/**
 * Middleware: 路由保護與認證檢查
 * 
 * This middleware runs on Vercel Edge Network
 */
export function middleware(request) {
  const { pathname } = request.nextUrl

  // V4 系統頁面 - 直接允許不需要認證
  if (pathname.startsWith('/v4') || pathname.startsWith('/test')) {
    return NextResponse.next()
  }

  // 登入頁面
  if (pathname === '/login') {
    return NextResponse.next()
  }
  
  // 靜態 HTML 檔案
  if (pathname.endsWith('.html')) {
    return NextResponse.next()
  }
  
  // 公開 API 路由
  if (pathname.startsWith('/api/public/')) {
    return NextResponse.next()
  }
  
  // 靜態資源
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.startsWith('/public/')) {
    return NextResponse.next()
  }
  
  if (pathname === '/favicon.ico' || pathname === '/manifest.json') {
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
