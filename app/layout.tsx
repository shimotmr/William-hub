import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'William Hub',
  description: 'Personal command center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-[#090b10] text-gray-100 min-h-screen antialiased">{children}</body>
    </html>
  )
}
