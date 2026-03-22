import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware: 路由保護與認證檢查
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // V4 系統頁面 - 優先檢查
  if (pathname.startsWith('/v4')) {
    return NextResponse.next()
  }

  // Test 頁面
  if (pathname.startsWith('/test') || pathname.startsWith('/test-direct')) {
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

// 設定 middleware 匹配所有路徑
export const config = {
  matcher: '/:path*',
}
