import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware: 路由保護與認證檢查
 * 
 * 公開路由：
 * - 登入頁面 (/login)
 * - 靜態HTML檔案 (*.html)
 * - V4系統頁面 (/v4*)
 * - 公開API (/api/public/*)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 檢查是否為公開路由
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 檢查 session cookie
  const session = request.cookies.get('session')
  
  if (!session) {
    // 未登入，重導向到登入頁
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // 已登入，允許訪問
  return NextResponse.next()
}

/**
 * 判斷是否為公開路由
 */
function isPublicRoute(pathname: string): boolean {
  // 登入頁面
  if (pathname === '/login') {
    return true
  }

  // 靜態 HTML 檔案
  if (pathname.endsWith('.html')) {
    return true
  }

  // V4 系統頁面（包含 /v4, /v4/architecture, /v4-*, 等）
  if (pathname.startsWith('/v4')) {
    return true
  }

  // 公開 API 路由
  if (pathname.startsWith('/api/public/')) {
    return true
  }

  // 靜態資源（Next.js 自動處理，但明確列出以防萬一）
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/public/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return true
  }

  return false
}

// 設定 middleware 匹配的路徑
// 排除靜態資源和 API 路由中的公開路徑
export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
