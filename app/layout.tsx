import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'William Hub',
  description: 'Personal command center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-[#0a0a0f] text-white min-h-screen antialiased">{children}</body>
    </html>
  )
}
